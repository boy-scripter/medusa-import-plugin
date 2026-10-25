import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EVENTS, IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { emit, serializeJob } from "../../helpers"
import { isStale } from "../../../../../lib/runner"

/**
 * POST /admin/imports/:id/continue - the "Continue Job" action.
 * Allowed for interrupted jobs (processing without heartbeat), failed or paused jobs.
 * Resumes from the last DB checkpoint: completed batches are never re-run.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  const resumable = isStale(job) || ["failed", "paused"].includes(job.status)
  if (!resumable) return void res.status(409).json({ message: `Job is "${job.status}" and cannot be continued` })
  if (job.stage === "uploaded") return void res.status(409).json({ message: "Nothing to continue: preprocess the job first" })

  const preprocessing = job.stage === "preprocessing"
  // batches that were mid-flight stay "processing"; the runner treats them as pending and every step reconciles first
  // importing: queue as "pending" (a fresh heartbeat would make the runner think another worker is alive)
  const updated = await svc.updateImportJobs(
    preprocessing
      ? { id: job.id, status: "processing", heartbeat_at: new Date(), last_error: null }
      : { id: job.id, status: "pending", stage: "importing", last_error: null }
  )
  await emit(req.scope, preprocessing ? EVENTS.PREPROCESS : EVENTS.RUN, job.id)
  res.status(202).json({ job: serializeJob(updated), resumed_stage: preprocessing ? "preprocessing" : "importing" })
}
