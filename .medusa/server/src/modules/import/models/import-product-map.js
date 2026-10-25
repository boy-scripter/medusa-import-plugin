"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportProductMap = void 0;
const utils_1 = require("@medusajs/framework/utils");
/** product_key -> Medusa product id. Makes retries/continuation idempotent and scopes fresh-import deletion. */
exports.ImportProductMap = utils_1.model
    .define({ name: "import_product_map", tableName: "product_import_product_map" }, {
    id: utils_1.model.id().primaryKey(),
    source: utils_1.model.text(),
    product_key: utils_1.model.text(),
    product_id: utils_1.model.text().index(),
    variant_ids: utils_1.model.json().nullable(), // { sku: variant_id }
})
    .indexes([{ on: ["source", "product_key"], unique: true, where: "deleted_at IS NULL" }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXByb2R1Y3QtbWFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvaW1wb3J0L21vZGVscy9pbXBvcnQtcHJvZHVjdC1tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWlEO0FBRWpELGdIQUFnSDtBQUNuRyxRQUFBLGdCQUFnQixHQUFHLGFBQUs7S0FDbEMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSw0QkFBNEIsRUFBRSxFQUFFO0lBQy9FLEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBQzNCLE1BQU0sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3BCLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ3pCLFVBQVUsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0lBQ2hDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO0NBQzdELENBQUM7S0FDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQSJ9