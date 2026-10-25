import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"
import type { NormalizedProduct } from "../../modules/import/types"
import { catKey, nameKey, slugify, splitCategoryPath, uniqueHandle, type Taxonomy } from "../../modules/import/utils/taxonomy"

/**
 * Find-or-create categories (hierarchical), collections and tags BEFORE products are written.
 * - matching is case/space-insensitive on name (category: within the same parent)
 * - existing records are reused, never duplicated; handle clashes get a unique handle
 * - a create that fails (e.g. concurrent creation) re-reads and reuses what now exists
 * Safe to retry.
 */
export const resolveTaxonomyStep = createStep(
  { name: "import-resolve-taxonomy", maxRetries: 3, retryInterval: 2 },
  async (input: { job_id: string; products: NormalizedProduct[] }, { container }) => {
    const pm: any = container.resolve(Modules.PRODUCT)
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const out: Taxonomy = { categories: {}, collections: {}, tags: {} }

    // ---- categories ----
    const paths = [...new Set(input.products.map((p) => p.category).filter((x): x is string => !!x && splitCategoryPath(x).length > 0))]
    if (paths.length) {
      const load = () => pm.listProductCategories({}, { select: ["id", "name", "handle", "parent_category_id"], take: null }) as Promise<any[]>
      let all = await load()
      const find = (parent: string | null, name: string) =>
        all.find((c) => (c.parent_category_id ?? null) === parent && nameKey(c.name) === nameKey(name))
      for (const path of paths) {
        let parent: string | null = null, parentName: string | undefined
        for (const part of splitCategoryPath(path)) {
          let cat = find(parent, part)
          if (!cat) {
            const handle = uniqueHandle(slugify(part), new Set(all.map((c) => c.handle)), parentName ? slugify(parentName) : undefined, `${parent}|${part}`)
            try {
              const [created] = await pm.createProductCategories([{ name: part, handle, is_active: true, is_internal: false, parent_category_id: parent }])
              cat = created
              all.push(created)
            } catch (e) {
              all = await load() // created concurrently? reuse it
              cat = find(parent, part)
              if (!cat) throw e
            }
          }
          parent = cat.id; parentName = cat.name
        }
        out.categories[catKey(path)] = parent!
      }
    }

    // ---- collections ----
    const titles = [...new Set(input.products.map((p) => p.collection_name).filter((x): x is string => !!x && !!x.trim()))]
    if (titles.length) {
      const load = () => pm.listProductCollections({}, { select: ["id", "title", "handle"], take: null }) as Promise<any[]>
      let all = await load()
      for (const title of titles) {
        const findIt = () => all.find((c) => nameKey(c.title) === nameKey(title)) ?? all.find((c) => c.handle === slugify(title)) // same handle = same collection
        let col = findIt()
        if (!col) {
          try {
            const [created] = await pm.createProductCollections([{ title: title.trim(), handle: uniqueHandle(slugify(title), new Set(all.map((c) => c.handle))) }])
            col = created; all.push(created)
          } catch (e) {
            all = await load(); col = findIt()
            if (!col) throw e
          }
        }
        out.collections[nameKey(title)] = col.id
      }
    }

    // ---- tags (brand_tag) ----
    const values = [...new Set(input.products.map((p) => p.brand_tag).filter((x): x is string => !!x && !!x.trim()))]
    if (values.length) {
      const load = () => pm.listProductTags({}, { select: ["id", "value"], take: null }) as Promise<any[]>
      let all = await load()
      for (const value of values) {
        const findIt = () => all.find((t) => nameKey(t.value) === nameKey(value))
        let tag = findIt()
        if (!tag) {
          try {
            const [created] = await pm.createProductTags([{ value: value.trim() }])
            tag = created; all.push(created)
          } catch (e) {
            all = await load(); tag = findIt()
            if (!tag) throw e
          }
        }
        out.tags[nameKey(value)] = tag.id
      }
    }
    await svc.touch(input.job_id)
    return new StepResponse(out)
  }
)
