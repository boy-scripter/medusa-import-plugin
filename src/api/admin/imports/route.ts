import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IMPORT_MODULE } from "../../../modules/import/constants"
import type ImportModuleService from "../../../modules/import/service"
import { FileStore } from "../../../lib/file-store"
import { serializeJob } from "./helpers"

/** GET /admin/imports - list jobs */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const limit = Math.min(Number(req.query.limit ?? 20), 100), offset = Number(req.query.offset ?? 0)
  const [jobs, count] = await svc.listAndCountImportJobs({}, { order: { created_at: "DESC" }, take: limit, skip: offset })
  res.json({ jobs: jobs.map(serializeJob), count, limit, offset })
}

/** POST /admin/imports - multipart upload (field "file"); creates a job in stage "uploaded" */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const file = (req as any).file as { originalname: string; buffer: Buffer } | undefined
  if (!file) return void res.status(400).json({ message: 'Attach a CSV as multipart field "file"' })
  if (!/\.csv$/i.test(file.originalname)) return void res.status(400).json({ message: "Only .csv files are accepted" })
  const header = file.buffer.subarray(0, 8192).toString("utf8").split(/\r?\n/)[0].toLowerCase()
  for (const col of ["title", "variant_sku"]) {
    if (!header.includes(col)) return void res.status(400).json({ message: `CSV header must contain "${col}"` })
  }
  const svc: ImportModuleService = req.scope.resolve(IMPORT_MODULE)
  const opts = svc.getOptions() // 500 with a clear message if the module is misconfigured
  const safe = file.originalname.replace(/[^\w.\-]+/g, "_").slice(-100)
  const job = await svc.createImportJobs({ source: opts.prefix_upload, filename: safe })
  try {
    const stored = await new FileStore(req.scope).put(`${opts.prefix_upload}/source/${job.id}/${safe}`, file.buffer, "text/csv")
    const updated = await svc.updateImportJobs({ id: job.id, source_file_id: stored.id })
    res.status(201).json({ job: serializeJob(updated) })
  } catch (e) {
    await svc.deleteImportJobs(job.id)
    throw e
  }
}
