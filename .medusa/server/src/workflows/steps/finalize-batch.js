"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeBatchStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const constants_1 = require("../../modules/import/constants");
/** The checkpoint. Runs only after every earlier step succeeded; counters are recomputed from batch rows (idempotent). */
exports.finalizeBatchStep = (0, workflows_sdk_1.createStep)({ name: "import-finalize-batch", maxRetries: 5, retryInterval: 2 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const [, failed] = await svc.listAndCountImportErrors({ batch_id: input.batch_id, severity: "error" }, { take: 1 });
    await svc.updateImportBatches({
        id: input.batch_id, status: failed ? "failed" : "completed", failed_count: failed,
        error: failed ? `${failed} error(s); see job errors` : null,
    });
    const done = await svc.listImportBatches({ job_id: input.job_id, status: "completed" }, { select: ["size"], take: null });
    const bad = await svc.listImportBatches({ job_id: input.job_id, status: "failed" }, { select: ["failed_count"], take: null });
    await svc.updateImportJobs({
        id: input.job_id, completed_batches: done.length,
        processed_products: done.reduce((a, b) => a + b.size, 0),
        failed_products: bad.reduce((a, b) => a + b.failed_count, 0), heartbeat_at: new Date(),
    });
    return new workflows_sdk_1.StepResponse({ batch_id: input.batch_id, failed });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluYWxpemUtYmF0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL2ZpbmFsaXplLWJhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSw4REFBOEQ7QUFHOUQsMEhBQTBIO0FBQzdHLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwwQkFBVSxFQUN6QyxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFDbEUsS0FBSyxFQUFFLEtBQTJDLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ25FLE1BQU0sR0FBRyxHQUF3QixTQUFTLENBQUMsT0FBTyxDQUFDLHlCQUFhLENBQUMsQ0FBQTtJQUNqRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ25ILE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDO1FBQzVCLEVBQUUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxNQUFNO1FBQ2pGLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQyxDQUFDLENBQUMsSUFBSTtLQUM1RCxDQUFDLENBQUE7SUFDRixNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFXLEVBQUUsQ0FBQyxDQUFBO0lBQ2hJLE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQVcsRUFBRSxDQUFDLENBQUE7SUFDcEksTUFBTSxHQUFHLENBQUMsZ0JBQWdCLENBQUM7UUFDekIsRUFBRSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDaEQsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN4RCxlQUFlLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLElBQUksRUFBRTtLQUN2RixDQUFDLENBQUE7SUFDRixPQUFPLElBQUksNEJBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7QUFDL0QsQ0FBQyxDQUNGLENBQUEifQ==