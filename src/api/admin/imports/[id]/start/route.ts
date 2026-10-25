import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { EVENTS, IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { freshPreview } from "../../../../../lib/fresh"
import { validateImportConfig } from "../../../../../lib/config-check"
import { emit, serializeJob } from "../../helpers"

const Body = z.object({
  mode: z.enum(["merge", "fresh"]).default("merge"),
  confirm_deletion: z.object({ token: z.string(), confirm: z.literal(true) }).optional(),
})

/** POST /admin/imports/:id/start - begin the import (merge by default; fresh needs a matching deletion-preview token) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = Body.safeParse(req.body ?? {})
  if (!body.success) return void res.status(400).json({ message: body.error.issues.map((i) => i.message).join("; ") })
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  if (job.stage !== "preprocessed") return void res.status(409).json({ message: `Job is in stage "${job.stage}"; preprocess it first` })
  if (job.status === "processing") return void res.status(409).json({ message: "Job is already running" })
  await validateImportConfig(req.scope) // fail fast with a clear message

  if (body.data.mode === "fresh") {
    const preview = await freshPreview(req.scope, job.source)
    if (!body.data.confirm_deletion || body.data.confirm_deletion.token !== preview.token) {
      return void res.status(409).json({ message: "Fresh import requires confirmation of the current deletion preview", deletion_preview: preview })
    }
  }
  const updated = await svc.updateImportJobs({
    id: job.id, mode: body.data.mode, fresh_confirmed: body.data.mode === "fresh", status: "pending", stage: "importing", // the runner flips it to "processing"
  })
  await emit(req.scope, EVENTS.RUN, job.id)
  res.status(202).json({ job: serializeJob(updated) })
}
