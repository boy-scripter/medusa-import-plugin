"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPricingStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const constants_1 = require("../../modules/import/constants");
/** Dealer prices -> configured price list. Creates missing entries, updates changed ones, skips equal ones (idempotent). */
exports.syncPricingStep = (0, workflows_sdk_1.createStep)({ name: "import-sync-pricing", maxRetries: 3, retryInterval: 3 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    const { price_list_id } = svc.getOptions();
    const wanted = [];
    for (const it of input.items) {
        const p = input.products.find((x) => x.key === it.key);
        for (const v of p.variants) {
            if (v.dealer_price != null && it.variants[v.sku])
                wanted.push({ variant_id: it.variants[v.sku], amount: v.dealer_price });
        }
    }
    if (!wanted.length)
        return new workflows_sdk_1.StepResponse({ created: 0, updated: 0 });
    const { data } = await query.graph({
        entity: "product_variant",
        fields: ["id", "price_set.id", "price_set.prices.id", "price_set.prices.amount", "price_set.prices.currency_code", "price_set.prices.price_list_id"],
        filters: { id: wanted.map((w) => w.variant_id) },
    });
    const existing = new Map();
    for (const v of data) {
        const pr = v.price_set?.prices?.find((x) => x.price_list_id === price_list_id && String(x.currency_code).toLowerCase() === input.currency_code);
        if (pr)
            existing.set(v.id, { id: pr.id, amount: Number(pr.amount) });
    }
    const create = [], update = [];
    for (const w of wanted) {
        const ex = existing.get(w.variant_id);
        if (!ex)
            create.push({ variant_id: w.variant_id, amount: w.amount, currency_code: input.currency_code });
        else if (ex.amount !== w.amount)
            update.push({ id: ex.id, variant_id: w.variant_id, amount: w.amount, currency_code: input.currency_code });
    }
    if (create.length || update.length) {
        await (0, core_flows_1.batchPriceListPricesWorkflow)(container).run({ input: { data: { id: price_list_id, create, update, delete: [] } } });
    }
    await svc.touch(input.job_id);
    return new workflows_sdk_1.StepResponse({ created: create.length, updated: update.length });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1wcmljaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy9zeW5jLXByaWNpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQTRFO0FBQzVFLHFEQUFxRTtBQUNyRSw0REFBMEU7QUFDMUUsOERBQThEO0FBSzlELDRIQUE0SDtBQUMvRyxRQUFBLGVBQWUsR0FBRyxJQUFBLDBCQUFVLEVBQ3ZDLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUNoRSxLQUFLLEVBQUUsS0FBb0csRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDNUgsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDaEUsTUFBTSxFQUFFLGFBQWEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUMxQyxNQUFNLE1BQU0sR0FBNkMsRUFBRSxDQUFBO0lBQzNELEtBQUssTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUUsQ0FBQTtRQUN2RCxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsQ0FBQyxZQUFZLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFBRSxNQUFNLENBQUMs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