import crypto from "crypto"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import { IMPORT_MODULE } from "../modules/import/constants"
import type ImportModuleService from "../modules/import/service"

/**
 * Products this import source created: mapped in product_import_product_map AND carrying
 * metadata.import_source = source. Maps whose product no longer exists are reported as `stale_maps`.
 */
async function managedProducts(container: MedusaContainer, source: string) {
  const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const maps = await svc.listImportProductMaps({ source }, { take: null as any })
    const found = new Map<string, { id: string; title: string }>()
    for (let i = 0; i < maps.length; i += 100) {
      const ids = maps.slice(i, i + 100).map((m) => m.product_id)
      const { data } = await query.graph({ entity: "product", fields: ["id", "title", "metadata"], filters: { id: ids } })
      for (const p of data as any[]) if (p?.metadata?.import_source === source) found.set(p.id, { id: p.id, title: p.title })
    }
    const stale_maps = maps.filter((m) => !found.has(m.product_id))
    return { products: [...found.values()], stale_maps }
  } catch (e: any) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Could not build the deletion preview: ${e?.message ?? e}`)
  }
}

/** Deletion preview for fresh mode. The token binds the confirmation to this exact set of products. */
export async function freshPreview(container: MedusaContainer, source: string) {
  const { products } = await managedProducts(container, source)
  const token = crypto.createHash("sha256").update(source + "\n" + products.map((p) => p.id).sort().join(",")).digest("hex").slice(0, 32)
  return { source, count: products.length, sample: products.slice(0, 25), token }
}

/**
 * Deletes ONLY products created by this import source. Chunked; if a chunk fails it falls back to
 * one-by-one so a single problem product cannot block the rest. Failures are returned (and become
 * job errors), and their map rows are kept so the following import merges into them instead of duplicating.
 */
export async function runFreshCleanup(container: MedusaContainer, source: string) {
  const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
  const { products, stale_maps } = await managedProducts(container, source)
  const deleted = new Set<string>()
  const failed: { id: string; title: string; message: string }[] = []
  const del = (ids: string[]) => deleteProductsWorkflow(container).run({ input: { ids } })

  for (let i = 0; i < products.length; i += 25) {
    const chunk = products.slice(i, i + 25)
    try {
      await del(chunk.map((p) => p.id))
      chunk.forEach((p) => deleted.add(p.id))
    } catch {
      for (const p of chunk) {
        try { await del([p.id]); deleted.add(p.id) } catch (e: any) { failed.push({ id: p.id, title: p.title, message: String(e?.message ?? e) }) }
      }
    }
  }
  const stale = stale_maps.map((m) => m.id)
  const mapsToDrop = (await svc.listImportProductMaps({ source }, { take: null as any })).filter((m) => deleted.has(m.product_id) || stale.includes(m.id))
  if (mapsToDrop.length) await svc.deleteImportProductMaps(mapsToDrop.map((m) => m.id))
  return { deleted: deleted.size, failed }
}
