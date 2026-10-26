import fs from "fs"
import os from "os"
import path from "path"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { IMPORT_MODULE } from "../../modules/import/constants"
import type ImportModuleService from "../../modules/import/service"
import { preprocessCsv } from "../../modules/import/utils/preprocess"
import { FileStore } from "../../lib/file-store"

/** Stage 1. Re-runnable: wipes artifacts of earlier attempts first. Progress persisted in DB. */
export const preprocessCsvStep = createStep(
  { name: "import-preprocess-csv", maxRetries: 2, retryInterval: 5 },
  async (input: { job_id: string }, { container }) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
    const files = new FileStore(container)
    const opts = svc.getOptions()
    const job = await svc.retrieveImportJob(input.job_id)
    if (!job.source_file_id) throw new Error("Job has no uploaded source file")

    // reset earlier attempt
    const oldBatches = await svc.listImportBatches({ job_id: job.id }, { select: ["id"], take: null as any })
    const oldErrors = await svc.listImportErrors({ job_id: job.id }, { select: ["id"], take: null as any })
    if (oldBatches.length) await svc.deleteImportBatches(oldBatches.map((b) => b.id))
    if (oldErrors.length) await svc.deleteImportErrors(oldErrors.map((e) => e.id))
    const oldParts = ((job.parts as any[]) ?? []).map((p) => p.file_id)
    await files.remove(oldParts).catch(() => undefined)
    await svc.updateImportJobs({
      id: job.id, stage: "preprocessing", status: "processing", parts: null, last_error: null, heartbeat_at: new Date(),
      total_rows: 0, total_products: 0, total_variants: 0, total_batches: 0, completed_batches: 0, processed_products: 0, failed_products: 0,
    })

    const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "product-import-"))
    try {
      const csvPath = path.join(workDir, "source.csv")
      await files.downloadTo(job.source_file_id, csvPath)

      const parts: { file_id: string; count: number }[] = []
      let batchIdx = 0
      const result = await preprocessCsv({
        csvPath, workDir,
        onPart: async ({ index, products }) => {
          const stored = await files.put(
            `${opts.prefix_upload}/processed/${job.id}/part-${String(index).padStart(5, "0")}.ndjson`,
            products.map((p) => JSON.stringify(p)).join("\n"), "application/x-ndjson"
          )
          parts.push({ file_id: stored.id, count: products.length })
          const rows: any[] = []
          for (let off = 0; off < products.length; off += opts.batch_size) {
            const slice = products.slice(off, off + opts.batch_size)
            rows.push({ job_id: job.id, idx: batchIdx++, part_file_id: stored.id, start_line: off, size: slice.length, product_keys: slice.map((p) => p.key) })
          }
          await svc.createImportBatches(rows)
          // checkpoint: parts + counters persisted after every part
          await svc.updateImportJobs({ id: job.id, parts, total_batches: batchIdx, heartbeat_at: new Date() })
        },
        onTick: () => svc.touch(job.id),
        onIssues: async (issues) => {
          await svc.recordErrors(issues.map((i) => ({ job_id: job.id, product_key: i.product_key, row_number: i.row, stage: "preprocess", severity: i.severity, message: i.message })))
          await svc.touch(job.id)
        },
      })
      if (result.total_products === 0) throw new Error("No valid products found in CSV; see errors")
      await svc.updateImportJobs({
        id: job.id, stage: "preprocessed", status: "pending", parts, total_batches: batchIdx,
        total_rows: result.total_rows, total_products: result.total_products, total_variants: result.total_variants, heartbeat_at: new Date(),
      })
      return new StepResponse({ job_id: job.id, ...result, total_batches: batchIdx })
    } catch (e: any) {
      await svc.updateImportJobs({ id: job.id, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) })
      throw e
    } finally {
      await fs.promises.rm(workDir, { recursive: true, force: true })
    }
  }
)
