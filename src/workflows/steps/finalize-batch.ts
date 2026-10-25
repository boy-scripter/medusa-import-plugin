import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"

/** The checkpoint. Runs only after every earlier step succeeded; counters are recomputed from batch rows (idempotent). */
export const finalizeBatchStep = createStep(
  { name: "import-finalize-batch", maxRetries: 5, retryInterval: 2 },
  async (input: { job_id: string; batch_id: string }, { container }) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const [, failed] = await svc.listAndCountImportErrors({ batch_id: input.batch_id, severity: "error" }, { take: 1 })
    await svc.updateImportBatches({
      id: input.batch_id, status: failed ? "failed" : "completed", failed_count: failed,
      error: failed ? `${failed} error(s); see job errors` : null,
    })
    const done = await svc.listImportBatches({ job_id: input.job_id, status: "completed" }, { select: ["size"], take: null as any })
    const bad = await svc.listImportBatches({ job_id: input.job_id, status: "failed" }, { select: ["failed_count"], take: null as any })
    await svc.updateImportJobs({
      id: input.job_id, completed_batches: done.length,
      processed_products: done.reduce((a, b) => a + b.size, 0),
      failed_products: bad.reduce((a, b) => a + b.failed_count, 0), heartbeat_at: new Date(),
    })
    return new StepResponse({ batch_id: input.batch_id, failed })
  }
)
