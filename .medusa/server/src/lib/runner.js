"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStale = void 0;
exports.runImportJob = runImportJob;
const constants_1 = require("../modules/import/constants");
const import_product_batch_1 = require("../workflows/import-product-batch");
const config_check_1 = require("./config-check");
const fresh_1 = require("./fresh");
const running = new Set(); // in-process guard against double execution
const isStale = (job) => job.status === "processing" && (!job.heartbeat_at || Date.now() - new Date(job.heartbeat_at).getTime() > constants_1.STALE_MS);
exports.isStale = isStale;
/**
 * Sequentially runs pending/interrupted batches. Safe to call again at any time (Continue Job):
 * it only touches batches that are not completed, and every step is idempotent.
 */
async function runImportJob(container, jobId) {
    if (running.has(jobId))
        return;
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    running.add(jobId);
    try {
        const job = await svc.retrieveImportJob(jobId);
        if (job.status === "processing" && !(0, exports.isStale)(job))
            return; // another worker is alive
        await svc.updateImportJobs({ id: jobId, stage: "importing", status: "processing", last_error: null, heartbeat_at: new Date() });
        let ctx;
        try {
            ctx = await (0, config_check_1.validateImportConfig)(container);
            if (job.mode === "fresh") {
                if (!job.fresh_confirmed)
                    throw new Error("Fresh import was not confirmed");
                if (!job.fresh_cleanup_done) {
                    const { failed } = await (0, fresh_1.runFreshCleanup)(container, job.source);
                    await svc.recordErrors(failed.map((f) => ({ job_id: jobId, product_key: f.id, stage: "fresh-cleanup", message: `could not delete "${f.title}": ${f.message}` })));
                    await svc.updateImportJobs({ id: jobId, fresh_cleanup_done: true, heartbeat_at: new Date() }); // checkpoint
                }
            }
        }
        catch (e) {
            await svc.updateImportJobs({ id: jobId, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) });
            return;
        }
        while (true) {
            const [batch] = await svc.listImportBatches({ job_id: jobId, status: ["pending", "processing"] }, { order: { idx: "ASC" }, take: 1 });
            if (!batch)
                break;
            const { errors } = await (0, import_product_batch_1.importProductBatchWorkflow)(container).run({
                input: { job_id: jobId, batch_id: batch.id, ...ctx },
                throwOnError: false,
            });
            if (errors?.length) {
                const msg = String(errors[0]?.error?.message ?? "batch workflow failed").slice(0, 2000);
                await svc.updateImportBatches({ id: batch.id, status: "failed", error: msg });
                await svc.recordErrors([{ job_id: jobId, batch_id: batch.id, stage: "batch", message: msg }]);
                const bad = await svc.listImportBatches({ job_id: jobId, status: "failed" }, { select: ["failed_count"], take: null });
                await svc.updateImportJobs({ id: jobId, failed_products: bad.reduce((a, b) => a + b.failed_count, 0), heartbeat_at: new Date() });
            }
        }
        const [, failed] = await svc.listAndCountImportBatches({ job_id: jobId, status: "failed" }, { take: 1 });
        await svc.updateImportJobs({
            id: jobId, stage: failed ? "importing" : "completed", status: failed ? "completed_with_errors" : "completed", heartbeat_at: new Date(),
        });
    }
    catch (e) {
        await svc.updateImportJobs({ id: jobId, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) }).catch(() => undefined);
    }
    finally {
        running.delete(jobId);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBZ0JBLG9DQWlEQztBQWhFRCwyREFBcUU7QUFFckUsNEVBQThFO0FBQzlFLGlEQUFxRDtBQUNyRCxtQ0FBeUM7QUFFekMsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQSxDQUFDLDRDQUE0QztBQUV2RSxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQTRELEVBQUUsRUFBRSxDQUN0RixHQUFHLENBQUMsTUFBTSxLQUFLLFlBQVksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFHLG9CQUFRLENBQUMsQ0FBQTtBQUR2RyxRQUFBLE9BQU8sV0FDZ0c7QUFFcEg7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLFlBQVksQ0FBQyxTQUEwQixFQUFFLEtBQWE7SUFDMUUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUFFLE9BQU07SUFDOUIsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDbEIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFlBQVksSUFBSSxDQUFDLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU0sQ0FBQywwQkFBMEI7UUFDbkYsTUFBTSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUss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