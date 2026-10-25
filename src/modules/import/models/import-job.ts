import { model } from "@medusajs/framework/utils"

export const ImportJob = model.define({ name: "import_job", tableName: "product_import_job" }, {
  id: model.id().primaryKey(),
  source: model.text(), // prefix_upload at creation time; scopes fresh-import deletion
  filename: model.text().nullable(),
  mode: model.enum(["merge", "fresh"]).default("merge"),
  stage: model.enum(["uploaded", "preprocessing", "preprocessed", "importing", "completed"]).default("uploaded"),
  status: model.enum(["pending", "processing", "paused", "completed", "completed_with_errors", "failed"]).default("pending"),
  source_file_id: model.text().nullable(),
  parts: model.json().nullable(), // [{ file_id, count }]
  total_rows: model.number().default(0),
  total_products: model.number().default(0),
  total_variants: model.number().default(0),
  total_batches: model.number().default(0),
  completed_batches: model.number().default(0),
  processed_products: model.number().default(0),
  failed_products: model.number().default(0),
  fresh_confirmed: model.boolean().default(false),
  fresh_cleanup_done: model.boolean().default(false),
  heartbeat_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),
})
