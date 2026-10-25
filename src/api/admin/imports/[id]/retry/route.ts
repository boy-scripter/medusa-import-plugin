import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { EVENTS, IMPORT_MODULE } from "../../../../../modules/import/constants"
import type ImportModuleService from "../../../../../modules/import/service"
import { emit, serializeJob } from "../../helpers"
import { isStale } from "../../../../../lib/runner"

const Body = z.object({ batch_id: z.string().optional() })

/** POST /admin/imports/:id/retry - re-queue failed batches (all, or one via batch_id) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = Body.safeParse(req.body ?? {})
  if (!body.success) return void res.status(400).json({ message: "invalid body" })
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const job = await svc.retrieveImportJob(req.params.id)
  if (job.status === "processing" && !isStale(job)) return void res.status(409).json({ message: "Job is running" })
  const failed = await svc.listImportBatches(
    { job_id: job.id, status: "failed", ...(body.data.batch_id ? { id: body.data.batch_id } : {}) }, { select: ["id"], take: null as any }
  )
  if (!failed.length) return void res.status(409).json({ message: "No failed batches to retry" })
  await svc.updateImportBatches(failed.map((b) => ({ id: b.id, status: "pending" as const, error: null })))
  const updated = await svc.updateImportJobs({ id: job.id, status: "pending", stage: "importing" })
  await emit(req.scope, EVENTS.RUN, job.id)
  res.status(202).json({ job: serializeJob(updated), requeued: failed.length })
}
