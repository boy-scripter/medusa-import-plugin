"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeJob = serializeJob;
exports.emit = emit;
const utils_1 = require("@medusajs/framework/utils");
const runner_1 = require("../../../lib/runner");
/** Public shape of a job: no file ids/URLs, no config IDs, no credentials. */
function serializeJob(j) {
    return {
        id: j.id, filename: j.filename, mode: j.mode, stage: j.stage, status: j.status, interrupted: (0, runner_1.isStale)(j),
        total_rows: j.total_rows, total_products: j.total_products, total_variants: j.total_variants,
        total_batches: j.total_batches, completed_batches: j.completed_batches,
        processed_products: j.processed_products, failed_products: j.failed_products,
        fresh_confirmed: j.fresh_confirmed, heartbeat_at: j.heartbeat_at, last_error: j.last_error,
        created_at: j.created_at, updated_at: j.updated_at,
    };
}
async function emit(container, name, id) {
    await container.resolve(utils_1.Modules.EVENT_BUS).emit({ name, data: { id } });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vaW1wb3J0cy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBS0Esb0NBU0M7QUFFRCxvQkFFQztBQWpCRCxxREFBbUQ7QUFDbkQsZ0RBQTZDO0FBRTdDLDhFQUE4RTtBQUM5RSxTQUFnQixZQUFZLENBQUMsQ0FBTTtJQUNqQyxPQUFPO1FBQ0wsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLElBQUEsZ0JBQU8sRUFBQyxDQUFDLENBQUM7UUFDdkcsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxjQUFjO1FBQzVGLGFBQWEsRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUI7UUFDdEUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsZUFBZTtRQUM1RSxlQUFlLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7UUFDMUYsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVO0tBQ25ELENBQUE7QUFDSCxDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxTQUEwQixFQUFFLElBQVksRUFBRSxFQUFVO0lBQzdFLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUN6RSxDQUFDIn0=