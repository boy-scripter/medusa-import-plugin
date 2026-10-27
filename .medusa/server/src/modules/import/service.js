"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const import_job_1 = require("./models/import-job");
const import_batch_1 = require("./models/import-batch");
const import_error_1 = require("./models/import-error");
const import_product_map_1 = require("./models/import-product-map");
const import_image_map_1 = require("./models/import-image-map");
const options_1 = require("./utils/options");
class ImportModuleService extends (0, utils_1.MedusaService)({ ImportJob: import_job_1.ImportJob, ImportBatch: import_batch_1.ImportBatch, ImportError: import_error_1.ImportError, ImportProductMap: import_product_map_1.ImportProductMap, ImportImageMap: import_image_map_1.ImportImageMap }) {
    constructor(container, options) {
        // @ts-ignore - MedusaService forwards all constructor args
        super(...arguments);
        this.options_ = options ?? {};
    }
    /** Validated options. Throws before any import starts if configuration is incomplete. */
    getOptions() {
        return (0, options_1.validateOptions)(this.options_);
    }
    async touch(jobId) {
        await this.updateImportJobs({ id: jobId, heartbeat_at: new Date() });
    }
    async recordErrors(rows) {
        if (!rows.length)
            return;
        for (let i = 0; i < rows.length; i += 200) {
            await this.createImportErrors(rows.slice(i, i + 200).map((r) => ({ severity: "error", ...r, message: r.message.slice(0, 2000) })));
        }
    }
}
exports.default = ImportModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC9zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscURBQXlEO0FBQ3pELG9EQUErQztBQUMvQyx3REFBbUQ7QUFDbkQsd0RBQW1EO0FBQ25ELG9FQUE4RDtBQUM5RCxnRUFBMEQ7QUFDMUQsNkNBQWlEO0FBYWpELE1BQU0sbUJBQW9CLFNBQVEsSUFBQSxxQkFBYSxFQUFDLEVBQUUsU0FBUyxFQUFULHNCQUFTLEVBQUUsV0FBVyxFQUFYLDBCQUFXLEVBQUUsV0FBVyxFQUFYLDBCQUFXLEVBQUUsZ0JBQWdCLEVBQWhCLHFDQUFnQixFQUFFLGNBQWMsRUFBZCxpQ0FBYyxFQUFFLENBQUM7SUFHeEgsWUFBWSxTQUFrQyxFQUFFLE9BQTBDO1FBQ3hGLDJEQUEyRDtRQUMzRCxLQUFLLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQTtRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUVELHlGQUF5RjtJQUN6RixVQUFVO1FBQ1IsT0FBTyxJQUFBLHlCQUFlLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQWE7UUFDdkIsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN0RSxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFnQjtRQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFBRSxPQUFNO1FBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMxQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFnQixFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQzdHLENBQUE7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsa0JBQWUsbUJBQW1CLENBQUEifQ==