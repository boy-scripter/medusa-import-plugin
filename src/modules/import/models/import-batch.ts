import { model } from "@medusajs/framework/utils"

export const ImportBatch = model
  .define({ name: "import_batch", tableName: "product_import_batch" }, {
    id: model.id().primaryKey(),
    job_id: model.text().index(),
    idx: model.number(),
    part_file_id: model.text(),
    start_line: model.number(),
    size: model.number(),
    status: model.enum(["pending", "processing", "completed", "failed"]).default("pending"),
    attempts: model.number().default(0),
    failed_count: model.number().default(0),
    product_keys: model.json().nullable(),
    error: model.text().nullable(),
  })
  .indexes([{ on: ["job_id", "idx"], unique: true, where: "deleted_at IS NULL" }])
