"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.freshPreview = freshPreview;
exports.runFreshCleanup = runFreshCleanup;
const crypto_1 = __importDefault(require("crypto"));
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const constants_1 = require("../modules/import/constants");
/**
 * Products this import source created: mapped in product_import_product_map AND carrying
 * metadata.import_source = source. Maps whose product no longer exists are reported as `stale_maps`.
 */
async function managedProducts(container, source) {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    try {
        const maps = await svc.listImportProductMaps({ source }, { take: null });
        const found = new Map();
        for (let i = 0; i < maps.length; i += 100) {
            const ids = maps.slice(i, i + 100).map((m) => m.product_id);
            const { data } = await query.graph({ entity: "product", fields: ["id", "title", "metadata"], filters: { id: ids } });
            for (const p of data)
                if (p?.metadata?.import_source === source)
                    found.set(p.id, { id: p.id, title: p.title });
        }
        const stale_maps = maps.filter((m) => !found.has(m.product_id));
        return { products: [...found.values()], stale_maps };
    }
    catch (e) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Could not build the deletion preview: ${e?.message ?? e}`);
    }
}
/** Deletion preview for fresh mode. The token binds the confirmation to this exact set of products. */
async function freshPreview(container, source) {
    const { products } = await managedProducts(container, source);
    const token = crypto_1.default.createHash("sha256").update(source + "\n" + products.map((p) => p.id).sort().join(",")).digest("hex").slice(0, 32);
    return { source, count: products.length, sample: products.slice(0, 25), token };
}
/**
 * Deletes ONLY products created by this import source. Chunked; if a chunk fails it falls back to
 * one-by-one so a single problem product cannot block the rest. Failures are returned (and become
 * job errors), and their map rows are kept so the following import merges into them instead of duplicating.
 */
async function runFreshCleanup(container, source) {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const { products, stale_maps } = await managedProducts(container, source);
    const deleted = new Set();
    const failed = [];
    const del = (ids) => (0, core_flows_1.deleteProductsWorkflow)(container).run({ input: { ids } });
    for (let i = 0; i < products.length; i += 25) {
        const chunk = products.slice(i, i + 25);
        try {
            await del(chunk.map((p) => p.id));
            chunk.forEach((p) => deleted.add(p.id));
        }
        catch {
            for (const p of chunk) {
                try {
                    await del([p.id]);
                    deleted.add(p.id);
                }
                catch (e) {
                    failed.push({ id: p.id, title: p.title, message: String(e?.message ?? e) });
                }
            }
        }
    }
    const stale = stale_maps.map((m) => m.id);
    const mapsToDrop = (await svc.listImportProductMaps({ source }, { take: null })).filter((m) => deleted.has(m.product_id) || stale.includes(m.id));
    if (mapsToDrop.length)
        await svc.deleteImportProductMaps(mapsToDrop.map((m) => m.id));
    return { deleted: deleted.size, failed };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJlc2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2ZyZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBOEJBLG9DQUlDO0FBT0QsMENBc0JDO0FBL0RELG9EQUEyQjtBQUMzQixxREFBa0Y7QUFDbEYsNERBQW9FO0FBRXBFLDJEQUEyRDtBQUczRDs7O0dBR0c7QUFDSCxLQUFLLFVBQVUsZUFBZSxDQUFDLFNBQTBCLEVBQUUsTUFBYztJQUN2RSxNQUFNLEdBQUcsR0FBd0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyx5QkFBYSxDQUFDLENBQUE7SUFDakUsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQVcsRUFBRSxDQUFDLENBQUE7UUFDL0UsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUE7UUFDOUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzFDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUMzRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDcEgsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFhO2dCQUFFLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxhQUFhLEtBQUssTUFBTTtvQkFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUE7UUFDekgsQ0FBQztRQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTtRQUMvRCxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQTtJQUN0RCxDQUFDO0lBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztRQUNoQixNQUFNLElBQUksbUJBQVcsQ0FBQyxtQkFBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZILENBQUM7QUFDSCxDQUFDO0FBRUQsdUdBQXVHO0FBQ2hHLEtBQUssVUFBVSxZQUFZLENBQUMsU0FBMEIsRUFBRSxNQUFjO0lBQzNFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLGVBQWUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDN0QsTUFBTSxLQUFLLEdBQUcsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZJLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFBO0FBQ2pGLENBQUM7QUFFRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLGVBQWUsQ0FBQyxTQUEwQixFQUFFLE1BQWM7SUFDOUUsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxlQUFlLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQ3pFLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUE7SUFDakMsTUFBTSxNQUFNLEdBQXFELEVBQUUsQ0FBQTtJQUNuRSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFLENBQUMsSUFBQSxtQ0FBc0IsRUFBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFeEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQzdDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUN2QyxJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNqQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3pDLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxLQUFLLE1BQU0sQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUM7b0JBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFBQyxDQUFDO2dCQUFDLE9BQU8sQ0FBTSxFQUFFLENBQUM7b0JBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQUMsQ0FBQztZQUM3SSxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDekMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDeEosSUFBSSxVQUFVLENBQUMsTUFBTTtRQUFFLE1BQU0sR0FBRyxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3JGLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQTtBQUMxQyxDQUFDIn0=