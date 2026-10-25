"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportBatch = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.ImportBatch = utils_1.model
    .define({ name: "import_batch", tableName: "product_import_batch" }, {
    id: utils_1.model.id().primaryKey(),
    job_id: utils_1.model.text().index(),
    idx: utils_1.model.number(),
    part_file_id: utils_1.model.text(),
    start_line: utils_1.model.number(),
    size: utils_1.model.number(),
    status: utils_1.model.enum(["pending", "processing", "completed", "failed"]).default("pending"),
    attempts: utils_1.model.number().default(0),
    failed_count: utils_1.model.number().default(0),
    product_keys: utils_1.model.json().nullable(),
    error: utils_1.model.text().nullable(),
})
    .indexes([{ on: ["job_id", "idx"], unique: true, where: "deleted_at IS NULL" }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWJhdGNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvaW1wb3J0L21vZGVscy9pbXBvcnQtYmF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWlEO0FBRXBDLFFBQUEsV0FBVyxHQUFHLGFBQUs7S0FDN0IsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsRUFBRTtJQUNuRSxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUMzQixNQUFNLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRTtJQUM1QixHQUFHLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRTtJQUNuQixZQUFZLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUMxQixVQUFVLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRTtJQUMxQixJQUFJLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRTtJQUNwQixNQUFNLEVBQUUsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUN2RixRQUFRLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbkMsWUFBWSxFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLFlBQVksRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3JDLEtBQUssRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0NBQy9CLENBQUM7S0FDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQSJ9