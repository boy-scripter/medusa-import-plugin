import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IMPORT_MODULE } from "../../../../modules/import/constants"
import type ImportModuleService from "../../../../modules/import/service"
import { serializeJob } from "../helpers"

/** GET /admin/imports/:id - job, batches (first 200) and latest errors (first 50) */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const id = req.params.id
  const job = await svc.retrieveImportJob(id)
  const batches = await svc.listImportBatches({ job_id: id }, { order: { idx: "ASC" }, take: 200, select: ["id", "idx", "size", "status", "attempts", "failed_count", "error"] })
  const [errors, error_count] = await svc.listAndCountImportErrors({ job_id: id }, { order: { created_at: "DESC" }, take: 50 })
  const [, failed_batches] = await svc.listAndCountImportBatches({ job_id: id, status: "failed" }, { take: 1 })
  res.json({ job: serializeJob(job), batches, failed_batches, errors, error_count })
}
