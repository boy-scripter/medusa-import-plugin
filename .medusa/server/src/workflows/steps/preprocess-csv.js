"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessCsvStep = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const constants_1 = require("../../modules/import/constants");
const preprocess_1 = require("../../modules/import/utils/preprocess");
const file_store_1 = require("../../lib/file-store");
/** Stage 1. Re-runnable: wipes artifacts of earlier attempts first. Progress persisted in DB. */
exports.preprocessCsvStep = (0, workflows_sdk_1.createStep)({ name: "import-preprocess-csv", maxRetries: 2, retryInterval: 5 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const files = new file_store_1.FileStore(container);
    const opts = svc.getOptions();
    const job = await svc.retrieveImportJob(input.job_id);
    if (!job.source_file_id)
        throw new Error("Job has no uploaded source file");
    // reset earlier attempt
    const oldBatches = await svc.listImportBatches({ job_id: job.id }, { select: ["id"], take: null });
    const oldErrors = await svc.listImportErrors({ job_id: job.id }, { select: ["id"], take: null });
    if (oldBatches.length)
        await svc.deleteImportBatches(oldBatches.map((b) => b.id));
    if (oldErrors.length)
        await svc.deleteImportErrors(oldErrors.map((e) => e.id));
    const oldParts = (job.parts ?? []).map((p) => p.file_id);
    await files.remove(oldParts).catch(() => undefined);
    await svc.updateImportJobs({
        id: job.id, stage: "preprocessing", status: "processing", parts: null, last_error: null, heartbeat_at: new Date(),
        total_rows: 0, total_products: 0, total_variants: 0, total_batches: 0, completed_batches: 0, processed_products: 0, failed_products: 0,
    });
    const workDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), "product-import-"));
    try {
        const csvPath = path_1.default.join(workDir, "source.csv");
        await files.downloadTo(job.source_file_id, csvPath);
        const parts = [];
        let batchIdx = 0;
        const result = await (0, preprocess_1.preprocessCsv)({
            csvPath, workDir,
            onPart: async ({ index, products }) => {
                const stored = await files.put(`${opts.prefix_upload}/processed/${job.id}/part-${String(index).padStart(5, "0")}.ndjson`, products.map((p) => JSON.stringify(p)).join("\n"), "application/x-ndjson");
                parts.push({ file_id: stored.id, count: products.length });
                const rows = [];
                for (let off = 0; off < products.length; off += constants_1.BATCH_SIZE) {
                    const slice = products.slice(off, off + constants_1.BATCH_SIZE);
                    rows.push({ job_id: job.id, idx: batchIdx++, part_file_id: stored.id, start_line: off, size: slice.length, product_keys: slice.map((p) => p.key) });
                }
                await svc.createImportBatches(rows);
                // checkpoint: parts + counters persisted after every part
                await svc.updateImportJobs({ id: job.id, parts, total_batches: batchIdx, heartbeat_at: new Date() });
            },
            onTick: () => svc.touch(job.id),
            onIssues: async (issues) => {
                await svc.recordErrors(issues.map((i) => ({ job_id: job.id, product_key: i.product_key, row_number: i.row, stage: "preprocess", severity: i.severity, message: i.message })));
                await svc.touch(job.id);
            },
        });
        if (result.total_products === 0)
            throw new Error("No valid products found in CSV; see errors");
        await svc.updateImportJobs({
            id: job.id, stage: "preprocessed", status: "pending", parts, total_batches: batchIdx,
            total_rows: result.total_rows, total_products: result.total_products, total_variants: result.total_variants, heartbeat_at: new Date(),
        });
        return new workflows_sdk_1.StepResponse({ job_id: job.id, ...result, total_batches: batchIdx });
    }
    catch (e) {
        await svc.updateImportJobs({ id: job.id, status: "failed", last_error: String(e?.message ?? e).slice(0, 2000) });
        throw e;
    }
    finally {
        await fs_1.default.promises.rm(workDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlcHJvY2Vzcy1jc3YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3ByZXByb2Nlc3MtY3N2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRDQUFtQjtBQUNuQiw0Q0FBbUI7QUFDbkIsZ0RBQXVCO0FBQ3ZCLHFFQUE0RTtBQUM1RSw4REFBMEU7QUFFMUUsc0VBQXFFO0FBQ3JFLHFEQUFnRDtBQUVoRCxpR0FBaUc7QUFDcEYsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLDBCQUFVLEVBQ3pDLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUNsRSxLQUFLLEVBQUUsS0FBeUIsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDakQsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sS0FBSyxHQUFHLElBQUksc0JBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUN0QyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDN0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3JELElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQTtJQUUzRSx3QkFBd0I7SUFDeEIsTUFBTSxVQUFVLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQVcsRUFBRSxDQUFDLENBQUE7SUFDekcsTUFBTSxTQUFTLEdB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