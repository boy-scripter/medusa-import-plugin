"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportJob = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.ImportJob = utils_1.model.define({ name: "import_job", tableName: "product_import_job" }, {
    id: utils_1.model.id().primaryKey(),
    source: utils_1.model.text(), // prefix_upload at creation time; scopes fresh-import deletion
    filename: utils_1.model.text().nullable(),
    mode: utils_1.model.enum(["merge", "fresh"]).default("merge"),
    stage: utils_1.model.enum(["uploaded", "preprocessing", "preprocessed", "importing", "completed"]).default("uploaded"),
    status: utils_1.model.enum(["pending", "processing", "paused", "completed", "completed_with_errors", "failed"]).default("pending"),
    source_file_id: utils_1.model.text().nullable(),
    parts: utils_1.model.json().nullable(), // [{ file_id, count }]
    total_rows: utils_1.model.number().default(0),
    total_products: utils_1.model.number().default(0),
    total_variants: utils_1.model.number().default(0),
    total_batches: utils_1.model.number().default(0),
    completed_batches: utils_1.model.number().default(0),
    processed_products: utils_1.model.number().default(0),
    failed_products: utils_1.model.number().default(0),
    fresh_confirmed: utils_1.model.boolean().default(false),
    fresh_cleanup_done: utils_1.model.boolean().default(false),
    heartbeat_at: utils_1.model.dateTime().nullable(),
    last_error: utils_1.model.text().nullable(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWpvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC9tb2RlbHMvaW1wb3J0LWpvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUQ7QUFFcEMsUUFBQSxTQUFTLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLEVBQUU7SUFDN0YsRUFBRSxFQUFFLGFBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUU7SUFDM0IsTUFBTSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSwrREFBK0Q7SUFDckYsUUFBUSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDakMsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ3JELEtBQUssRUFBRSxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUM5RyxNQUFNLEVBQUUsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDMUgsY0FBYyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdkMsS0FBSyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSx1QkFBdUI7SUFDdkQsVUFBVSxFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLGNBQWMsRUFBRSxhQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN6QyxjQUFjLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDekMsYUFBYSxFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLGlCQUFpQixFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzVDLGtCQUFrQixFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdDLGVBQWUsRUFBRSxhQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMxQyxlQUFlLEVBQUUsYUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDL0Msa0JBQWtCLEVBQUUsYUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDbEQsWUFBWSxFQUFFLGFBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDekMsVUFBVSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDcEMsQ0FBQyxDQUFBIn0=