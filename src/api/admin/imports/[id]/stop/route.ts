import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { serializeJob } from "../../helpers"

/** POST /admin/imports/:id/stop - pause a running import. The current batch finishes, then the runner exits. Resume with /continue. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  if (job.stage !== "importing" || !["processing", "pending"].includes(job.status)) {
    return void res.status(409).json({ message: `Job is "${job.status}" (${job.stage}) and cannot be stopped` })
  }
  const updated = await svc.updateImportJobs({ id: job.id, status: "paused" })
  res.status(200).json({ job: serializeJob(updated) })
}
