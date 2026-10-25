"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportImageMap = void 0;
const utils_1 = require("@medusajs/framework/utils");
/** Source image URL -> uploaded file, so images are never uploaded twice. */
exports.ImportImageMap = utils_1.model
    .define({ name: "import_image_map", tableName: "product_import_image_map" }, {
    id: utils_1.model.id().primaryKey(),
    source: utils_1.model.text(),
    url_hash: utils_1.model.text(),
    source_url: utils_1.model.text(),
    file_id: utils_1.model.text(),
    file_url: utils_1.model.text(),
})
    .indexes([{ on: ["source", "url_hash"], unique: true, where: "deleted_at IS NULL" }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWltYWdlLW1hcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC9tb2RlbHMvaW1wb3J0LWltYWdlLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUQ7QUFFakQsNkVBQTZFO0FBQ2hFLFFBQUEsY0FBYyxHQUFHLGFBQUs7S0FDaEMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxFQUFFO0lBQzNFLEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBQzNCLE1BQU0sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3BCLFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3RCLFVBQVUsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3hCLE9BQU8sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3JCLFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0NBQ3ZCLENBQUM7S0FDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQSJ9