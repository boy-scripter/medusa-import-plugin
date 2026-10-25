"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportError = void 0;
const utils_1 = require("@medusajs/framework/utils");
exports.ImportError = utils_1.model.define({ name: "import_error", tableName: "product_import_error" }, {
    id: utils_1.model.id().primaryKey(),
    job_id: utils_1.model.text().index(),
    batch_id: utils_1.model.text().index().nullable(),
    product_key: utils_1.model.text().nullable(),
    row_number: utils_1.model.number().nullable(),
    stage: utils_1.model.text(),
    severity: utils_1.model.enum(["error", "warning"]).default("error"),
    message: utils_1.model.text(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWVycm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvaW1wb3J0L21vZGVscy9pbXBvcnQtZXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWlEO0FBRXBDLFFBQUEsV0FBVyxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsRUFBRSxFQUFFO0lBQ25HLEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBQzNCLE1BQU0sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0lBQzVCLFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3pDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLFVBQVUsRUFBRSxhQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3JDLEtBQUssRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFO0lBQ25CLFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUMzRCxPQUFPLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtDQUN0QixDQUFDLENBQUEifQ==