import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { loadBatchStep } from "./steps/load-batch"
import { uploadImagesStep } from "./steps/upload-images"
import { resolveTaxonomyStep } from "./steps/resolve-taxonomy"
import { upsertProductsStep } from "./steps/upsert-products"
import { syncPricingStep } from "./steps/sync-pricing"
import { syncInventoryStep } from "./steps/sync-inventory"
import { finalizeBatchStep } from "./steps/finalize-batch"

export type ImportBatchInput = { job_id: string; batch_id: string; location_id: string; currency_code: string }

/**
 * One batch (<= 10 complete products incl. variants): products -> images -> pricing -> inventory -> checkpoint.
 * Each step carries Medusa's maxRetries; upsertProductsStep has a compensation that removes only what this run created.
 */
export const importProductBatchWorkflow = createWorkflow(
  { name: "import-product-batch", store: true },
  (input: ImportBatchInput) => {
    const batch = loadBatchStep({ job_id: input.job_id, batch_id: input.batch_id })

    const imgIn = transform({ input, batch }, (d) => ({ job_id: d.input.job_id, batch_id: d.input.batch_id, source: d.batch.source, products: d.batch.products }))
    const uploaded = uploadImagesStep(imgIn)

    const taxIn = transform({ input, batch }, (d) => ({ job_id: d.input.job_id, products: d.batch.products }))
    const taxonomy = resolveTaxonomyStep(taxIn)

    const upIn = transform({ input, batch, uploaded, taxonomy }, (d) => ({
      job_id: d.input.job_id, batch_id: d.input.batch_id, source: d.batch.source, products: d.batch.products,
      images: d.uploaded.images, currency_code: d.input.currency_code, taxonomy: d.taxonomy,
    }))
    const upserted = upsertProductsStep(upIn)

    const priceIn = transform({ input, batch, upserted }, (d) => ({
      job_id: d.input.job_id, products: d.batch.products, items: d.upserted.items, currency_code: d.input.currency_code,
    }))
    const priced = syncPricingStep(priceIn)

    const invIn = transform({ input, batch, upserted, priced }, (d) => ({
      job_id: d.input.job_id, products: d.batch.products, items: d.upserted.items, location_id: d.input.location_id,
    }))
    const stocked = syncInventoryStep(invIn)

    const finIn = transform({ input, stocked }, (d) => ({ job_id: d.input.job_id, batch_id: d.input.batch_id }))
    return new WorkflowResponse(finalizeBatchStep(finIn))
  }
)
