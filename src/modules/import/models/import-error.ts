import { model } from "@medusajs/framework/utils"

export const ImportError = model.define({ name: "import_error", tableName: "product_import_error" }, {
  id: model.id().primaryKey(),
  job_id: model.text().index(),
  batch_id: model.text().index().nullable(),
  product_key: model.text().nullable(),
  row_number: model.number().nullable(),
  stage: model.text(),
  severity: model.enum(["error", "warning"]).default("error"),
  message: model.text(),
})
