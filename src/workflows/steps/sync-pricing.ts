import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { batchPriceListPricesWorkflow } from "@medusajs/medusa/core-flows"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"
import type { NormalizedProduct } from "../../modules/import/types"
import type { UpsertItem } from "./upsert-products"

/** Dealer prices -> configured price list. Creates missing entries, updates changed ones, skips equal ones (idempotent). */
export const syncPricingStep = createStep(
  { name: "import-sync-pricing", maxRetries: 3, retryInterval: 3 },
  async (input: { job_id: string; products: NormalizedProduct[]; items: UpsertItem[]; currency_code: string }, { container }) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { price_list_id } = svc.getOptions()
    const wanted: { variant_id: string; amount: number }[] = []
    for (const it of input.items) {
      const p = input.products.find((x) => x.key === it.key)!
      for (const v of p.variants) {
        if (v.dealer_price != null && it.variants[v.sku]) wanted.push({ variant_id: it.variants[v.sku], amount: v.dealer_price })
      }
    }
    if (!wanted.length) return new StepResponse({ created: 0, updated: 0 })

    const { data } = await query.graph({
      entity: "product_variant",
      fields: ["id", "price_set.id", "price_set.prices.id", "price_set.prices.amount", "price_set.prices.currency_code", "price_set.prices.price_list_id"],
      filters: { id: wanted.map((w) => w.variant_id) },
    })
    const existing = new Map<string, { id: string; amount: number }>()
    for (const v of data as any[]) {
      const pr = v.price_set?.prices?.find((x: any) => x.price_list_id === price_list_id && String(x.currency_code).toLowerCase() === input.currency_code)
      if (pr) existing.set(v.id, { id: pr.id, amount: Number(pr.amount) })
    }
    const create: any[] = [], update: any[] = []
    for (const w of wanted) {
      const ex = existing.get(w.variant_id)
      if (!ex) create.push({ variant_id: w.variant_id, amount: w.amount, currency_code: input.currency_code })
      else if (ex.amount !== w.amount) update.push({ id: ex.id, variant_id: w.variant_id, amount: w.amount, currency_code: input.currency_code })
    }
    if (create.length || update.length) {
      await batchPriceListPricesWorkflow(container).run({ input: { data: { id: price_list_id, create, update, delete: [] } } as any })
    }
    await svc.touch(input.job_id)
    return new StepResponse({ created: create.length, updated: update.length })
  }
)
