"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProductsStep = void 0;
const crypto_1 = __importDefault(require("crypto"));
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const constants_1 = require("../../modules/import/constants");
const taxonomy_1 = require("../../modules/import/utils/taxonomy");
/** Validation/conflict problem for ONE product: recorded, product skipped. Anything else is rethrown so the step retries. */
class ProductImportError extends Error {
}
const slug = (s) => s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "item";
const short = (s) => crypto_1.default.createHash("sha1").update(s).digest("hex").slice(0, 6);
exports.upsertProductsStep = (0, workflows_sdk_1.createStep)({ name: "import-upsert-products", maxRetries: 3, retryInterval: 3 }, async (input, { container }) => {
    const ctx = new Upserter(container, input.source, input.currency_code, input.taxonomy, input.job_id);
    const items = [];
    const createdProductIds = [];
    const createdMapKeys = [];
    const errors = [];
    for (const p of input.products) {
        try {
            const urls = p.images.map((u) => input.images[u]).filter(Boolean);
            const item = await ctx.upsert(p, urls);
            items.push(item);
            if (item.created) {
                createdProductIds.push(item.product_id);
                createdMapKeys.push(p.key);
            }
        }
        catch (e) {
            if (!(e instanceof ProductImportError))
                throw e;
            errors.push({
                job_id: input.job_id,
                batch_id: input.batch_id,
                product_key: p.key,
                stage: "products",
                message: e.message,
            });
        }
    }
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    await svc.recordErrors(errors);
    await svc.touch(input.job_id);
    return new workflows_sdk_1.StepResponse({ items }, { createdProductIds, createdMapKeys, source: input.source });
}, 
// compensation: if a later step ultimately fails, remove only what THIS run created; the batch can then be retried cleanly
async (comp, { container }) => {
    if (!comp)
        return;
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    if (comp.createdProductIds.length) {
        await (0, core_flows_1.deleteProductsWorkflow)(container).run({
            input: { ids: comp.createdProductIds },
        });
    }
    if (comp.createdMapKeys.length) {
        const maps = await svc.listImportProductMaps({
            source: comp.source,
            product_key: comp.createdMapKeys,
        });
        if (maps.length)
            await svc.deleteImportProductMaps(maps.map((m) => m.id));
    }
});
class Upserter {
    constructor(container, source, currency, tx, jobId) {
        this.container = container;
        this.source = source;
        this.currency = currency;
        this.tx = tx;
        this.jobId = jobId;
        this.svc = container.resolve(constants_1.IMPORT_MODULE);
        this.query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        this.pm = container.resolve(utils_1.Modules.PRODUCT);
    }
    async getProduct(id) {
        const { data } = await this.query.graph({
            entity: "product",
            fields: [
                "id",
                "handle",
                "metadata",
                "options.id",
                "options.title",
                "options.values.value",
                "variants.id",
                "variants.sku",
                "tags.id",
            ],
            filters: { id },
        });
        return data[0];
    }
    /**
     * Matching order:
     *  1. product map (same product key imported before) -> that product
     *  2. otherwise a product that already owns one of these SKUs (pre-existing / earlier import / manual) -> updated by SKU
     *  3. otherwise a new product
     * Medusa requires unique SKUs, so two DIFFERENT products of the same CSV must not share a SKU. That used to
     * silently fold every product into the first one; it is now reported as a conflict and the product is skipped.
     */
    async resolveExisting(p) {
        const map = (await this.svc.listImportProductMaps({
            source: this.source,
            product_key: p.key,
        }))[0];
        const skus = p.variants.map((v) => v.sku);
        const hits = await this.findVariantsBySku(skus);
        const mapped = map ? await this.getProduct(map.product_id) : undefined;
        const foreign = [
            ...new Set(hits.map((h) => h.product_id)),
        ].filter((id) => id !== mapped?.id);
        if (mapped) {
            if (foreign.length)
                throw new ProductImportError(`SKU conflict: SKU(s) of this product already belong to a different product (${foreign.join(", ")})`);
            return { map, product: mapped };
        }
        if (foreign.length > 1)
            throw new ProductImportError(`SKU conflict: the SKUs of this product belong to ${foreign.length} different existing products`);
        if (foreign.length === 1) {
            const owner = await this.getProduct(foreign[0]);
            const shared = hits
                .filter((h) => h.product_id === foreign[0])
                .map((h) => h.sku)
                .join(", ");
            if (owner?.metadata?.import_job_id === this.jobId &&
                owner.metadata.import_key !== p.key) {
                throw new ProductImportError(`SKU conflict inside this CSV: SKU(s) [${shared}] are also used by product "${owner.metadata.import_key}". Medusa needs unique SKUs per variant; make them unique in the CSV.`);
            }
            return { map, product: owner };
        }
        return { map, product: undefined };
    }
    /**
     * Exact-SKU lookup through the Product module (ORM-level, no GraphQL string building: SKUs such as
     * 5430-i7-8-256-Int GFX-14"NT contain quotes/spaces). Results are re-checked for an EXACT match so a
     * dropped/loosened filter can never make unrelated variants (and products) look like matches.
     */
    async findVariantsBySku(skus) {
        const wanted = new Set(skus);
        const rows = (await this.pm.listProductVariants({ sku: skus }, { select: ["id", "sku", "product_id"], take: null }));
        return rows.filter((r) => r?.product_id && wanted.has(r.sku));
    }
    variantPayload(v) {
        return {
            title: v.title,
            sku: v.sku,
            manage_inventory: true,
            options: v.options,
            prices: v.price != null
                ? [{ amount: v.price, currency_code: this.currency }]
                : [],
            metadata: { attributes: v.attributes, import_source: this.source },
        };
    }
    async upsert(p, imageUrls) {
        const opts = this.svc.getOptions();
        const { map, product: existing } = await this.resolveExisting(p);
        // ids come from resolve-taxonomy (find-or-create, case-insensitive); a missing id means "not provided"
        const category_id = p.category
            ? this.tx.categories[(0, taxonomy_1.catKey)(p.category)]
            : undefined;
        const collection_id = p.collection_name
            ? this.tx.collections[(0, taxonomy_1.nameKey)(p.collection_name)]
            : undefined;
        const tag_id = p.brand_tag ? this.tx.tags[(0, taxonomy_1.nameKey)(p.brand_tag)] : undefined;
        if (p.category && !category_id)
            throw new ProductImportError(`category "${p.category}" could not be resolved`);
        if (p.collection_name && !collection_id)
            throw new ProductImportError(`collection "${p.collection_name}" could not be resolved`);
        const metadata = {
            attributes: p.attributes,
        };
        const common = {
            title: p.title,
            subtitle: p.subtitle ?? undefined,
            description: p.description ?? undefined,
            status: p.status,
            ...(category_id ? { categories: [{ id: category_id }] } : {}),
            ...(collection_id ? { collection_id } : {}),
            ...(imageUrls.length
                ? { images: imageUrls.map((url) => ({ url })), thumbnail: imageUrls[0] }
                : {}),
        };
        let productId, created = false;
        if (!existing) {
            let handle = slug(p.title);
            const { data: clash } = await this.query.graph({
                entity: "product",
                fields: ["id"],
                filters: { handle },
            });
            if (clash.length)
                handle = `${handle}-${short(p.key)}`;
            const { result } = await (0, core_flows_1.createProductsWorkflow)(this.container).run({
                input: {
                    products: [
                        {
                            ...common,
                            handle,
                            metadata,
                            ...(tag_id ? { tags: [{ id: tag_id }] } : {}),
                            options: p.options.map((o) => ({
                                title: o.title,
                                values: o.values,
                            })),
                            variants: p.variants.map((v) => this.variantPayload(v)),
                            shipping_profile_id: opts.shipping_profile_id,
                            sales_channels: [{ id: opts.sales_channel_id }],
                        },
                    ],
                },
            });
            productId = result[0].id;
            created = true;
        }
        else {
            productId = existing.id;
            const known = new Map(existing.options.map((o) => [
                o.title,
                new Set(o.values.map((x) => x.value)),
            ]));
            const mergedOptions = [
                ...existing.options.map((o) => ({
                    id: o.id,
                    title: o.title,
                    values: [
                        ...new Set([
                            ...known.get(o.title),
                            ...(p.options.find((x) => x.title === o.title)?.values ?? []),
                        ]),
                    ],
                })),
                ...p.options
                    .filter((o) => !known.has(o.title))
                    .map((o) => ({ title: o.title, values: o.values })),
            ];
            await (0, core_flows_1.updateProductsWorkflow)(this.container).run({
                input: {
                    selector: { id: productId },
                    update: {
                        ...common,
                        ...(tag_id
                            ? {
                                tags: [
                                    ...new Set([
                                        ...(existing.tags ?? []).map((t) => t.id),
                                        tag_id,
                                    ]),
                                ].map((id) => ({ id })),
                            }
                            : {}),
                        options: mergedOptions,
                        metadata: { ...(existing.metadata ?? {}), ...metadata },
                    },
                },
            });
            const bySku = new Map(existing.variants.map((v) => [v.sku, v.id]));
            const toUpdate = p.variants.filter((v) => bySku.has(v.sku));
            const toCreate = p.variants.filter((v) => !bySku.has(v.sku));
            if (toCreate.length) {
                await (0, core_flows_1.createProductVariantsWorkflow)(this.container).run({
                    input: {
                        product_variants: toCreate.map((v) => ({
                            product_id: productId,
                            ...this.variantPayload(v),
                        })),
                    },
                });
            }
            if (toUpdate.length) {
                await (0, core_flows_1.updateProductVariantsWorkflow)(this.container).run({
                    input: {
                        product_variants: toUpdate.map((v) => ({
                            id: bySku.get(v.sku),
                            title: v.title,
                            prices: this.variantPayload(v).prices,
                            metadata: this.variantPayload(v).metadata,
                        })),
                    },
                });
            }
        }
        const fresh = await this.getProduct(productId);
        const variants = Object.fromEntries(fresh.variants.map((v) => [v.sku, v.id]));
        if (map)
            await this.svc.updateImportProductMaps({
                id: map.id,
                product_id: productId,
                variant_ids: variants,
            });
        else
            await this.svc.createImportProductMaps([
                {
                    source: this.source,
                    product_key: p.key,
                    product_id: productId,
                    variant_ids: variants,
                },
            ]);
        return { key: p.key, product_id: productId, variants, created };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBzZXJ0LXByb2R1Y3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy91cHNlcnQtcHJvZHVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLHFFQUE2RTtBQUM3RSxxREFBK0U7QUFDL0UsNERBTXFDO0FBRXJDLDhEQUErRDtBQU0vRCxrRUFJNkM7QUFFN0MsNkhBQTZIO0FBQzdILE1BQU0sa0JBQW1CLFNBQVEsS0FBSztDQUFHO0FBU3pDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FDekIsQ0FBQztLQUNFLFdBQVcsRUFBRTtLQUNiLFNBQVMsQ0FBQyxNQUFNLENBQUM7S0FDakIsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7S0FDeEIsSUFBSSxFQUFFO0tBQ04sT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7S0FDdkIsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7S0FDbkIsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUM7QUFDNUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUMxQixnQkFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFbkQsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLDBCQUFVLEVBQzFDLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUNuRSxLQUFLLEVBQ0gsS0FRQyxFQUNELEVBQUUsU0FBUyxFQUFFLEVBQ2IsRUFBRTtJQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksUUFBUSxD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