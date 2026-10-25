import type { MedusaContainer } from "@medusajs/framework/types"
import { IMPORT_MODULE, STALE_MS } from "../modules/import/constants"
import type ImportModuleService from "../modules/import/service"
import { importProductBatchWorkflow } from "../workflows/import-product-batch"
import { validateImportConfig } from "./config-check"
import { runFreshCleanup } from "./fresh"

const running = new Set<string>() // in-process guard against double execution

export const isStale = (job: { status: string; heartbeat_at?: Date | string | null }) =>
  job.status === "processing" && (!job.heartbeat_at || Date.now() - new Date(job.heartbeat_at).getTime() > STALE_MS)

/**
 * Sequentially runs pending/interrupted batches. Safe to call again at any time (Continue Job):
 * it only touches batches that are not completed, and every step is idempotent.
 */
export async function runImportJob(container: MedusaContainer, jobId: string) {
  if (running.has(jobId)) return
  const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
  running.add(jobId)
  try {
    const job = await svc.retrieveImportJob(jobId)
    if (job.status === "processing" && !isStale(job)) return // another worker is alive
    await svc.updateImportJobs({ id: jobId, stage: "importing", status: "processing", last_error: null, heartbeat_at: new Date() })

    let ctx
    try {
      ctx = await validateImportConfig(container)
      if (job.mode === "fresh") {
        if (!job.fresh_confirmed) throw new Error("Fresh import was not confirmed")
        if (!job.fresh_cleanup_done) {
          const { failed } = await runFreshCleanup(container, job.source)
          await svc.recordErrors(failed.map((f) => ({ job_id: jobId, product_key: f.id, stage: "fresh-cleanup", message: `could not delete "${f.title}": ${f.message}` })))
          await svc.updateImportJobs({ id: jobId, fresh_cleanup_done: true, heartbeat_at: new Date() }) // checkpoint
        }
      }
    } catch (e: any) {
      await svc.updateImportJobs({ id: jobId, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) })
      return
    }

    while (true) {
      const [batch] = await svc.listImportBatches({ job_id: jobId, status: ["pending", "processing"] }, { order: { idx: "ASC" }, take: 1 })
      if (!batch) break
      const { errors } = await importProductBatchWorkflow(container).run({
        input: { job_id: jobId, batch_id: batch.id, ...ctx },
        throwOnError: false,
      })
      if (errors?.length) {
        const msg = String((errors[0] as any)?.error?.message ?? "batch workflow failed").slice(0, 2000)
        await svc.updateImportBatches({ id: batch.id, status: "failed", error: msg })
        await svc.recordErrors([{ job_id: jobId, batch_id: batch.id, stage: "batch", message: msg }])
        const bad = await svc.listImportBatches({ job_id: jobId, status: "failed" }, { select: ["failed_count"], take: null as any })
        await svc.updateImportJobs({ id: jobId, failed_products: bad.reduce((a, b) => a + b.failed_count, 0), heartbeat_at: new Date() })
      }
    }
    const [, failed] = await svc.listAndCountImportBatches({ job_id: jobId, status: "failed" }, { take: 1 })
    await svc.updateImportJobs({
      id: jobId, stage: failed ? "importing" : "completed", status: failed ? "completed_with_errors" : "completed", heartbeat_at: new Date(),
    })
  } catch (e: any) {
    await svc.updateImportJobs({ id: jobId, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) }).catch(() => undefined)
  } finally {
    running.delete(jobId)
  }
}
