import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EVENTS, IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { emit, serializeJob } from "../../helpers"
import { isStale } from "../../../../../lib/runner"

/** POST /admin/imports/:id/preprocess - starts preprocessing in the background (202) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  if (job.stage === "importing" || job.stage === "completed") return void res.status(409).json({ message: "Job already imported products; upload a new CSV instead" })
  if (job.status === "processing" && !isStale(job)) return void res.status(409).json({ message: "Job is already running" })
  svc.getOptions()
  const updated = await svc.updateImportJobs({ id: job.id, stage: "preprocessing", status: "processing", heartbeat_at: new Date(), last_error: null })
  await emit(req.scope, EVENTS.PREPROCESS, job.id)
  res.status(202).json({ job: serializeJob(updated) })
}
