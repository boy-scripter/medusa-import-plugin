"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTaxonomyStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../../modules/import/constants");
const taxonomy_1 = require("../../modules/import/utils/taxonomy");
/**
 * Find-or-create categories (hierarchical), collections and tags BEFORE products are written.
 * - matching is case/space-insensitive on name (category: within the same parent)
 * - existing records are reused, never duplicated; handle clashes get a unique handle
 * - a create that fails (e.g. concurrent creation) re-reads and reuses what now exists
 * Safe to retry.
 */
exports.resolveTaxonomyStep = (0, workflows_sdk_1.createStep)({ name: "import-resolve-taxonomy", maxRetries: 3, retryInterval: 2 }, async (input, { container }) => {
    const pm = container.resolve(utils_1.Modules.PRODUCT);
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const out = { categories: {}, collections: {}, tags: {} };
    // ---- categories ----
    const paths = [...new Set(input.products.map((p) => p.category).filter((x) => !!x && (0, taxonomy_1.splitCategoryPath)(x).length > 0))];
    if (paths.length) {
        const load = () => pm.listProductCategories({}, { select: ["id", "name", "handle", "parent_category_id"], take: null });
        let all = await load();
        const find = (parent, name) => all.find((c) => (c.parent_category_id ?? null) === parent && (0, taxonomy_1.nameKey)(c.name) === (0, taxonomy_1.nameKey)(name));
        for (const path of paths) {
            let parent = null, parentName;
            for (const part of (0, taxonomy_1.splitCategoryPath)(path)) {
                let cat = find(parent, part);
                if (!cat) {
                    const handle = (0, taxonomy_1.uniqueHandle)((0, taxonomy_1.slugify)(part), new Set(all.map((c) => c.handle)), parentName ? (0, taxonomy_1.slugify)(parentName) : undefined, `${parent}|${part}`);
                    try {
                        const [created] = await pm.createProductCategories([{ name: part, handle, is_active: true, is_internal: false, parent_category_id: parent }]);
                        cat = created;
                        all.push(created);
                    }
                    catch (e) {
                        all = await load(); // created concurrently? reuse it
                        cat = find(parent, part);
                        if (!cat)
                            throw e;
                    }
                }
                parent = cat.id;
                parentName = cat.name;
            }
            out.categories[(0, taxonomy_1.catKey)(path)] = parent;
        }
    }
    // ---- collections ----
    const titles = [...new Set(input.products.map((p) => p.collection_name).filter((x) => !!x && !!x.trim()))];
    if (titles.length) {
        const load = () => pm.listProductCollections({}, { select: ["id", "title", "handle"], take: null });
        let all = await load();
        for (const title of titles) {
            const findIt = () => all.find((c) => (0, taxonomy_1.nameKey)(c.title) === (0, taxonomy_1.nameKey)(title)) ?? all.find((c) => c.handle === (0, taxonomy_1.slugify)(title)); // same handle = same collection
            let col = findIt();
            if (!col) {
                try {
                    const [created] = await pm.createProductCollections([{ title: title.trim(), handle: (0, taxonomy_1.uniqueHandle)((0, taxonomy_1.slugify)(title), new Set(all.map((c) => c.handle))) }]);
                    col = created;
                    all.push(created);
                }
                catch (e) {
                    all = await load();
                    col = findIt();
                    if (!col)
                        throw e;
                }
            }
            out.collections[(0, taxonomy_1.nameKey)(title)] = col.id;
        }
    }
    // ---- tags (brand_tag) ----
    const values = [...new Set(input.products.map((p) => p.brand_tag).filter((x) => !!x && !!x.trim()))];
    if (values.length) {
        const load = () => pm.listProductTags({}, { select: ["id", "value"], take: null });
        let all = await load();
        for (const value of values) {
            const findIt = () => all.find((t) => (0, taxonomy_1.nameKey)(t.value) === (0, taxonomy_1.nameKey)(value));
            let tag = findIt();
            if (!tag) {
                try {
                    const [created] = await pm.createProductTags([{ value: value.trim() }]);
                    tag = created;
                    all.push(created);
                }
                catch (e) {
                    all = await load();
                    tag = findIt();
                    if (!tag)
                        throw e;
                }
            }
            out.tags[(0, taxonomy_1.nameKey)(value)] = tag.id;
        }
    }
    await svc.touch(input.job_id);
    return new workflows_sdk_1.StepResponse(out);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS10YXhvbm9teS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3RlcHMvcmVzb2x2ZS10YXhvbm9teS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxRUFBNEU7QUFDNUUscURBQW1EO0FBQ25ELDhEQUE4RDtBQUc5RCxrRUFBOEg7QUFFOUg7Ozs7OztHQU1HO0FBQ1UsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLDBCQUFVLEVBQzNDLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUNwRSxLQUFLLEVBQUUsS0FBd0QsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDaEYsTUFBTSxFQUFFLEdBQVEsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbEQsTUFBTSxHQUFHLEdBQXdCLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQWEsQ0FBQyxDQUFBO0lBQ2pFLE1BQU0sR0FBRyxHQUFhLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQTtJQUVuRSx1QkFBdUI7SUFDdkIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUEsNEJBQWlCLEVBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNwSSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQixNQUFN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