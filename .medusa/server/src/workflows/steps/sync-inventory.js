"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncInventoryStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const constants_1 = require("../../modules/import/constants");
/** Sets absolute stock at the sales channel's stock location (create level or update if different) - safe to repeat. */
exports.syncInventoryStep = (0, workflows_sdk_1.createStep)({ name: "import-sync-inventory", maxRetries: 3, retryInterval: 3 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    const qty = new Map(); // variant_id -> quantity
    for (const it of input.items) {
        const p = input.products.find((x) => x.key === it.key);
        for (const v of p.variants)
            if (it.variants[v.sku])
                qty.set(it.variants[v.sku], v.inventory_quantity);
    }
    if (!qty.size)
        return new workflows_sdk_1.StepResponse({ created: 0, updated: 0 });
    const { data: variants } = await query.graph({
        entity: "product_variant", fields: ["id", "inventory_items.inventory_item_id"], filters: { id: [...qty.keys()] },
    });
    const target = new Map(); // inventory_item_id -> qty
    for (const v of variants) {
        const inv = v.inventory_items?.[0]?.inventory_item_id;
        if (inv)
            target.set(inv, qty.get(v.id));
    }
    if (!target.size)
        return new workflows_sdk_1.StepResponse({ created: 0, updated: 0 });
    const { data: levels } = await query.graph({
        entity: "inventory_level", fields: ["id", "inventory_item_id", "stocked_quantity"],
        filters: { inventory_item_id: [...target.keys()], location_id: input.location_id },
    });
    const have = new Map(levels.map((l) => [l.inventory_item_id, Number(l.stocked_quantity)]));
    const create = [], update = [];
    for (const [inventory_item_id, stocked_quantity] of target) {
        const cur = have.get(inventory_item_id);
        if (cur === undefined)
            create.push({ inventory_item_id, location_id: input.location_id, stocked_quantity });
        else if (cur !== stocked_quantity)
            update.push({ inventory_item_id, location_id: input.location_id, stocked_quantity });
    }
    if (create.length || update.length) {
        await (0, core_flows_1.batchInventoryItemLevelsWorkflow)(container).run({ input: { create, update, delete: [] } });
    }
    await svc.touch(input.job_id);
    return new workflows_sdk_1.StepResponse({ created: create.length, updated: update.length });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1pbnZlbnRvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL3N0ZXBzL3N5bmMtaW52ZW50b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUE0RTtBQUM1RSxxREFBcUU7QUFDckUsNERBQThFO0FBQzlFLDhEQUE4RDtBQUs5RCx3SEFBd0g7QUFDM0csUUFBQSxpQkFBaUIsR0FBRyxJQUFBLDBCQUFVLEVBQ3pDLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUNsRSxLQUFLLEVBQUUsS0FBa0csRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDMUgsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUEsQ0FBQyx5QkFBeUI7SUFDL0QsS0FBSyxNQUFNLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBRSxDQUFBO1FBQ3ZELEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVE7WUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0lBQ3ZHLENBQUM7SUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUk7UUFBRSxPQUFPLElBQUksNEJBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7SUFFbEUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDM0MsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxtQ0FBbUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUU7S0FDakgsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUEsQ0FBQywyQkFBMkI7SUFDcEUsS0FBSyxNQUFNLENBQUMsSUFBSSxRQUFpQixFQUFFLENBQUM7UUFDbEMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFBO1FBQ3JELElBQUksR0FBRztZQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQUE7SUFDMUMsQ0FBQztJQUNELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtRQUFFLE9BQU8sSUFBSSw0QkFBWSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNyRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN6QyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDO1FBQ2xGLE9BQU8sRUFBRSxFQUFFLGlCQUFpQixFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRTtLQUNuRixDQUFDLENBQUE7SUFDRixNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBa0IsTUFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNySCxNQUFNLE1BQU0sR0FBVSxFQUFFLEVBQUUsTUFBTSxHQUFVLEVBQUUsQ0FBQTtJQUM1QyxLQUFLLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUN2QyxJQUFJLEdBQUcsS0FBSyxTQUFTO1lBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQTthQUN0RyxJQUFJLEdBQUcsS0FBSyxnQkFBZ0I7WUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBQ3pILENBQUM7SUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25DLE1BQU0sSUFBQSw2Q0FBZ0MsRUFBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQVMsRUFBRSxDQUFDLENBQUE7SUFDekcsQ0FBQztJQUNELE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDN0IsT0FBTyxJQUFJLDRCQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7QUFDN0UsQ0FBQyxDQUNGLENBQUEifQ==