"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBatchStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const constants_1 = require("../../modules/import/constants");
const file_store_1 = require("../../lib/file-store");
exports.loadBatchStep = (0, workflows_sdk_1.createStep)({ name: "import-load-batch", maxRetries: 3, retryInterval: 2 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const batch = await svc.retrieveImportBatch(input.batch_id);
    const job = await svc.retrieveImportJob(input.job_id);
    // errors from earlier attempts of this batch are superseded
    const stale = await svc.listImportErrors({ batch_id: batch.id }, { select: ["id"], take: null });
    if (stale.length)
        await svc.deleteImportErrors(stale.map((e) => e.id));
    await svc.updateImportBatches({ id: batch.id, status: "processing", attempts: batch.attempts + 1, error: null, failed_count: 0 });
    await svc.touch(job.id);
    const buf = await new file_store_1.FileStore(container).getBuffer(batch.part_file_id);
    const lines = buf.toString("utf8").split("\n").filter(Boolean);
    const products = lines.slice(batch.start_line, batch.start_line + batch.size).map((l) => JSON.parse(l));
    return new workflows_sdk_1.StepResponse({ products, source: job.source });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1iYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3RlcHMvbG9hZC1iYXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxRUFBNEU7QUFDNUUsOERBQThEO0FBRzlELHFEQUFnRDtBQUVuQyxRQUFBLGFBQWEsR0FBRyxJQUFBLDBCQUFVLEVBQ3JDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUM5RCxLQUFLLEVBQUUsS0FBMkMsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDbkUsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMzRCxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDckQsNERBQTREO0lBQzVELE1BQU0sS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFXLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZHLElBQUksS0FBSyxDQUFDLE1BQU07UUFBRSxNQUFNLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN0RSxNQUFNLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDakksTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUV2QixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksc0JBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFBO0lBQ3hFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM5RCxNQUFNLFFBQVEsR0FBd0IsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzVILE9BQU8sSUFBSSw0QkFBWSxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtBQUMzRCxDQUFDLENBQ0YsQ0FBQSJ9