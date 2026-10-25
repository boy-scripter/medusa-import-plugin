import { model } from "@medusajs/framework/utils"

/** product_key -> Medusa product id. Makes retries/continuation idempotent and scopes fresh-import deletion. */
export const ImportProductMap = model
  .define({ name: "import_product_map", tableName: "product_import_product_map" }, {
    id: model.id().primaryKey(),
    source: model.text(),
    product_key: model.text(),
    product_id: model.text().index(),
    variant_ids: model.json().nullable(), // { sku: variant_id }
  })
  .indexes([{ on: ["source", "product_key"], unique: true, where: "deleted_at IS NULL" }])
