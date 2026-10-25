import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { batchInventoryItemLevelsWorkflow } from "@medusajs/medusa/core-flows"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"
import type { NormalizedProduct } from "../../modules/import/types"
import type { UpsertItem } from "./upsert-products"

/** Sets absolute stock at the sales channel's stock location (create level or update if different) - safe to repeat. */
export const syncInventoryStep = createStep(
  { name: "import-sync-inventory", maxRetries: 3, retryInterval: 3 },
  async (input: { job_id: string; products: NormalizedProduct[]; items: UpsertItem[]; location_id: string }, { container }) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const qty = new Map<string, number>() // variant_id -> quantity
    for (const it of input.items) {
      const p = input.products.find((x) => x.key === it.key)!
      for (const v of p.variants) if (it.variants[v.sku]) qty.set(it.variants[v.sku], v.inventory_quantity)
    }
    if (!qty.size) return new StepResponse({ created: 0, updated: 0 })

    const { data: variants } = await query.graph({
      entity: "product_variant", fields: ["id", "inventory_items.inventory_item_id"], filters: { id: [...qty.keys()] },
    })
    const target = new Map<string, number>() // inventory_item_id -> qty
    for (const v of variants as any[]) {
      const inv = v.inventory_items?.[0]?.inventory_item_id
      if (inv) target.set(inv, qty.get(v.id)!)
    }
    if (!target.size) return new StepResponse({ created: 0, updated: 0 })
    const { data: levels } = await query.graph({
      entity: "inventory_level", fields: ["id", "inventory_item_id", "stocked_quantity"],
      filters: { inventory_item_id: [...target.keys()], location_id: input.location_id },
    })
    const have = new Map<string, number>((levels as any[]).map((l) => [l.inventory_item_id, Number(l.stocked_quantity)]))
    const create: any[] = [], update: any[] = []
    for (const [inventory_item_id, stocked_quantity] of target) {
      const cur = have.get(inventory_item_id)
      if (cur === undefined) create.push({ inventory_item_id, location_id: input.location_id, stocked_quantity })
      else if (cur !== stocked_quantity) update.push({ inventory_item_id, location_id: input.location_id, stocked_quantity })
    }
    if (create.length || update.length) {
      await batchInventoryItemLevelsWorkflow(container).run({ input: { create, update, delete: [] } as any })
    }
    await svc.touch(input.job_id)
    return new StepResponse({ created: create.length, updated: update.length })
  }
)
