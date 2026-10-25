import { model } from "@medusajs/framework/utils"

/** Source image URL -> uploaded file, so images are never uploaded twice. */
export const ImportImageMap = model
  .define({ name: "import_image_map", tableName: "product_import_image_map" }, {
    id: model.id().primaryKey(),
    source: model.text(),
    url_hash: model.text(),
    source_url: model.text(),
    file_id: model.text(),
    file_url: model.text(),
  })
  .indexes([{ on: ["source", "url_hash"], unique: true, where: "deleted_at IS NULL" }])
