"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const constants_1 = require("../modules/import/constants");
const import_preprocess_1 = require("../workflows/import-preprocess");
async function handler({ event: { data }, container }) {
    // failures are persisted on the job by the step itself
    await (0, import_preprocess_1.importPreprocessWorkflow)(container).run({ input: { job_id: data.id }, throwOnError: false });
}
exports.config = { event: constants_1.EVENTS.PREPROCESS, context: { subscriberId: "product-import-preprocess" } };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWpvYi1wcmVwcm9jZXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL2ltcG9ydC1qb2ItcHJlcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSwwQkFHQztBQU5ELDJEQUFvRDtBQUNwRCxzRUFBeUU7QUFFMUQsS0FBSyxVQUFVLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBa0M7SUFDbEcsdURBQXVEO0lBQ3ZELE1BQU0sSUFBQSw0Q0FBd0IsRUFBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO0FBQ3BHLENBQUM7QUFDWSxRQUFBLE1BQU0sR0FBcUIsRUFBRSxLQUFLLEVBQUUsa0JBQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUUsWUFBWSxFQUFFLDJCQUEyQixFQUFFLEVBQUUsQ0FBQSJ9