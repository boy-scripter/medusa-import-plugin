import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"

/** GET /admin/imports/:id/errors?limit=&offset=&severity=error|warning&stage= */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const limit = Math.min(Number(req.query.limit ?? 50), 200), offset = Number(req.query.offset ?? 0)
  const filters: Record<string, unknown> = { job_id: req.params.id }
  if (req.query.severity === "error" || req.query.severity === "warning") filters.severity = req.query.severity
  if (typeof req.query.stage === "string") filters.stage = req.query.stage
  const [errors, count] = await svc.listAndCountImportErrors(filters, { order: { created_at: "DESC" }, take: limit, skip: offset })
  res.json({ errors, count, limit, offset })
}
