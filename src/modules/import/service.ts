import { MedusaService } from "@medusajs/framework/utils"
import { ImportJob } from "./models/import-job"
import { ImportBatch } from "./models/import-batch"
import { ImportError } from "./models/import-error"
import { ImportProductMap } from "./models/import-product-map"
import { ImportImageMap } from "./models/import-image-map"
import { validateOptions } from "./utils/options"
import type { ImportModuleOptions } from "./types"

type ErrorRow = {
  job_id: string
  batch_id?: string | null
  product_key?: string | null
  row_number?: number | null
  stage: string
  severity?: "error" | "warning"
  message: string
}

class ImportModuleService extends MedusaService({ ImportJob, ImportBatch, ImportError, ImportProductMap, ImportImageMap }) {
  protected readonly options_: Partial<ImportModuleOptions>

  constructor(container: Record<string, unknown>, options: Partial<ImportModuleOptions>) {
    // @ts-ignore - MedusaService forwards all constructor args
    super(...arguments)
    this.options_ = options ?? {}
  }

  /** Validated options. Throws before any import starts if configuration is incomplete. */
  getOptions(): ImportModuleOptions {
    return validateOptions(this.options_)
  }

  async touch(jobId: string) {
    await this.updateImportJobs({ id: jobId, heartbeat_at: new Date() })
  }

  async recordErrors(rows: ErrorRow[]) {
    if (!rows.length) return
    for (let i = 0; i < rows.length; i += 200) {
      await this.createImportErrors(
        rows.slice(i, i + 200).map((r) => ({ severity: "error" as const, ...r, message: r.message.slice(0, 2000) }))
      )
    }
  }
}

export default ImportModuleService
