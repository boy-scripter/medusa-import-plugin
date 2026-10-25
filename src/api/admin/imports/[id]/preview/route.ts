import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { FileStore } from "../../../../../lib/file-store"
import { freshPreview } from "../../../../../lib/fresh"
import { serializeJob } from "../../helpers"

/** GET /admin/imports/:id/preview[?mode=fresh] - sample of normalized products; with mode=fresh also the deletion preview + confirmation token */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  const parts = (job.parts as { file_id: string }[] | null) ?? []
  let sample: unknown[] = []
  if (parts.length) {
    try {
      const buf = await new FileStore(req.scope).getBuffer(parts[0].file_id)
      sample = buf.toString("utf8").split("\n").filter(Boolean).slice(0, 5).map((l) => JSON.parse(l))
    } catch (e: any) {
      req.scope.resolve("logger").warn(`product-import: could not read preview sample: ${e?.message ?? e}`)
    }
  }
  const [, warning_count] = await svc.listAndCountImportErrors({ job_id: job.id, severity: "warning" }, { take: 1 })
  const [, error_count] = await svc.listAndCountImportErrors({ job_id: job.id, severity: "error" }, { take: 1 })
  res.json({
    job: serializeJob(job), sample, warning_count, error_count,
    ...(req.query.mode === "fresh" ? { deletion_preview: await freshPreview(req.scope, job.source) } : {}),
  })
}
