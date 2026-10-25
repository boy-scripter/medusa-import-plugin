"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProductBatchWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const load_batch_1 = require("./steps/load-batch");
const upload_images_1 = require("./steps/upload-images");
const resolve_taxonomy_1 = require("./steps/resolve-taxonomy");
const upsert_products_1 = require("./steps/upsert-products");
const sync_pricing_1 = require("./steps/sync-pricing");
const sync_inventory_1 = require("./steps/sync-inventory");
const finalize_batch_1 = require("./steps/finalize-batch");
/**
 * One batch (<= 10 complete products incl. variants): products -> images -> pricing -> inventory -> checkpoint.
 * Each step carries Medusa's maxRetries; upsertProductsStep has a compensation that removes only what this run created.
 */
exports.importProductBatchWorkflow = (0, workflows_sdk_1.createWorkflow)({ name: "import-product-batch", store: true }, (input) => {
    const batch = (0, load_batch_1.loadBatchStep)({ job_id: input.job_id, batch_id: input.batch_id });
    const imgIn = (0, workflows_sdk_1.transform)({ input, batch }, (d) => ({ job_id: d.input.job_id, batch_id: d.input.batch_id, source: d.batch.source, products: d.batch.products }));
    const uploaded = (0, upload_images_1.uploadImagesStep)(imgIn);
    const taxIn = (0, workflows_sdk_1.transform)({ input, batch }, (d) => ({ job_id: d.input.job_id, products: d.batch.products }));
    const taxonomy = (0, resolve_taxonomy_1.resolveTaxonomyStep)(taxIn);
    const upIn = (0, workflows_sdk_1.transform)({ input, batch, uploaded, taxonomy }, (d) => ({
        job_id: d.input.job_id, batch_id: d.input.batch_id, source: d.batch.source, products: d.batch.products,
        images: d.uploaded.images, currency_code: d.input.currency_code, taxonomy: d.taxonomy,
    }));
    const upserted = (0, upsert_products_1.upsertProductsStep)(upIn);
    const priceIn = (0, workflows_sdk_1.transform)({ input, batch, upserted }, (d) => ({
        job_id: d.input.job_id, products: d.batch.products, items: d.upserted.items, currency_code: d.input.currency_code,
    }));
    const priced = (0, sync_pricing_1.syncPricingStep)(priceIn);
    const invIn = (0, workflows_sdk_1.transform)({ input, batch, upserted, priced }, (d) => ({
        job_id: d.input.job_id, products: d.batch.products, items: d.upserted.items, location_id: d.input.location_id,
    }));
    const stocked = (0, sync_inventory_1.syncInventoryStep)(invIn);
    const finIn = (0, workflows_sdk_1.transform)({ input, stocked }, (d) => ({ job_id: d.input.job_id, batch_id: d.input.batch_id }));
    return new workflows_sdk_1.WorkflowResponse((0, finalize_batch_1.finalizeBatchStep)(finIn));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXByb2R1Y3QtYmF0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL2ltcG9ydC1wcm9kdWN0LWJhdGNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUErRjtBQUMvRixtREFBa0Q7QUFDbEQseURBQXdEO0FBQ3hELCtEQUE4RDtBQUM5RCw2REFBNEQ7QUFDNUQsdURBQXNEO0FBQ3RELDJEQUEwRDtBQUMxRCwyREFBMEQ7QUFJMUQ7OztHQUdHO0FBQ1UsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLDhCQUFjLEVBQ3RELEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFDN0MsQ0FBQyxLQUF1QixFQUFFLEVBQUU7SUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBQSwwQkFBYSxFQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBRS9FLE1BQU0sS0FBSyxHQUFHLElBQUEseUJBQVMsRUFBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUM5SixNQUFNLFFBQVEsR0FBRyxJQUFBLGdDQUFnQixFQUFDLEtBQUssQ0FBQyxDQUFBO0lBRXhDLE1BQU0sS0FBSyxHQUFHLElBQUEseUJBQVMsRUFBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMs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