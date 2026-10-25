"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImportConfig = validateImportConfig;
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../modules/import/constants");
/** Validates options and that the configured Medusa records exist. Returns runtime context for batches. */
async function validateImportConfig(container) {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const o = svc.getOptions();
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    for (const [entity, id] of [["price_list", o.price_list_id], ["sales_channel", o.sales_channel_id], ["shipping_profile", o.shipping_profile_id]]) {
        const { data } = await query.graph({ entity, fields: ["id"], filters: { id } });
        if (!data.length)
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, `Configured ${entity} "${id}" does not exist`);
    }
    const { data: sc } = await query.graph({ entity: "sales_channel", fields: ["id", "stock_locations.id"], filters: { id: o.sales_channel_id } });
    const location_id = sc[0]?.stock_locations?.[0]?.id;
    if (!location_id) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Sales channel "${o.sales_channel_id}" has no stock location; link one so inventory can be set`);
    }
    const store = container.resolve(utils_1.Modules.STORE);
    const [s] = await store.listStores({}, { relations: ["supported_currencies"] });
    const cur = s?.supported_currencies?.find((c) => c.is_default) ?? s?.supported_currencies?.[0];
    if (!cur)
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Store has no supported currency");
    return { location_id: location_id, currency_code: String(cur.currency_code).toLowerCase() };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLWNoZWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9jb25maWctY2hlY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxvREFrQkM7QUF4QkQscURBQTJGO0FBRTNGLDJEQUEyRDtBQUczRCwyR0FBMkc7QUFDcEcsS0FBSyxVQUFVLG9CQUFvQixDQUFDLFNBQTBCO0lBQ25FLE1BQU0sR0FBRyxHQUF3QixTQUFTLENBQUMsT0FBTyxDQUFDLHlCQUFhLENBQUMsQ0FBQTtJQUNqRSxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDMUIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNoRSxLQUFLLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBVSxFQUFFLENBQUM7UUFDMUosTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJLG1CQUFXLENBQUMsbUJBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLGNBQWMsTUFBTSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtJQUNySCxDQUFDO0lBQ0QsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDOUksTUFBTSxXQUFXLEdBQUksRUFBRSxDQUFDLENBQUMsQ0FBUyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQTtJQUM1RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakIsTUFBTSxJQUFJLG1CQUFXLENBQUMsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUMsZ0JBQWdCLDJEQUEyRCxDQUFDLENBQUE7SUFDeEosQ0FBQztJQUNELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLEtBQUssQ0FBUSxDQUFBO0lBQ3JELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDL0UsTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ25HLElBQUksQ0FBQyxHQUFHO1FBQUUsTUFBTSxJQUFJLG1CQUFXLENBQUMsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLGlDQUFpQyxDQUFDLENBQUE7SUFDbEcsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFxQixFQUFFLGFBQWEsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUE7QUFDdkcsQ0FBQyJ9