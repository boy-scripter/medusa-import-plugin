import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"
import type { NormalizedProduct } from "../../modules/import/types"
import { FileStore } from "../../lib/file-store"

export const loadBatchStep = createStep(
  { name: "import-load-batch", maxRetries: 3, retryInterval: 2 },
  async (input: { job_id: string; batch_id: string }, { container }) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const batch = await svc.retrieveImportBatch(input.batch_id)
    const job = await svc.retrieveImportJob(input.job_id)
    // errors from earlier attempts of this batch are superseded
    const stale = await svc.listImportErrors({ batch_id: batch.id }, { select: ["id"], take: null as any })
    if (stale.length) await svc.deleteImportErrors(stale.map((e) => e.id))
    await svc.updateImportBatches({ id: batch.id, status: "processing", attempts: batch.attempts + 1, error: null, failed_count: 0 })
    await svc.touch(job.id)

    const buf = await new FileStore(container).getBuffer(batch.part_file_id)
    const lines = buf.toString("utf8").split("\n").filter(Boolean)
    const products: NormalizedProduct[] = lines.slice(batch.start_line, batch.start_line + batch.size).map((l) => JSON.parse(l))
    return new StepResponse({ products, source: job.source })
  }
)
