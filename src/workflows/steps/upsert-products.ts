import crypto from "crypto";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  updateProductsWorkflow,
  createProductVariantsWorkflow,
  updateProductVariantsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import type { MedusaContainer } from "@medusajs/framework/types";
import { IMPORT_MODULE } from "../../modules/import/constants";
import type ImportModuleService from "../../modules/import/service";
import type {
  NormalizedProduct,
  NormalizedVariant,
} from "../../modules/import/types";
import {
  catKey,
  nameKey,
  type Taxonomy,
} from "../../modules/import/utils/taxonomy";

/** Validation/conflict problem for ONE product: recorded, product skipped. Anything else is rethrown so the step retries. */
class ProductImportError extends Error {}

export type UpsertItem = {
  key: string;
  product_id: string;
  variants: Record<string, string>;
  created: boolean;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "item";
const short = (s: string) =>
  crypto.createHash("sha1").update(s).digest("hex").slice(0, 6);

export const upsertProductsStep = createStep(
  { name: "import-upsert-products", maxRetries: 3, retryInterval: 3 },
  async (
    input: {
      job_id: string;
      batch_id: string;
      source: string;
      products: NormalizedProduct[];
      images: Record<string, string>;
      currency_code: string;
      taxonomy: Taxonomy;
    },
    { container },
  ) => {
    const ctx = new Upserter(
      container,
      input.source,
      input.currency_code,
      input.taxonomy,
      input.job_id,
    );
    const items: UpsertItem[] = [];
    const createdProductIds: string[] = [];
    const createdMapKeys: string[] = [];
    const errors: {
      job_id: string;
      batch_id: string;
      product_key: string;
      stage: string;
      message: string;
    }[] = [];

    for (const p of input.products) {
      try {
        const urls = p.images.map((u) => input.images[u]).filter(Boolean);
        const item = await ctx.upsert(p, urls);
        items.push(item);
        if (item.created) {
          createdProductIds.push(item.product_id);
          createdMapKeys.push(p.key);
        }
      } catch (e: any) {
        if (!(e instanceof ProductImportError)) throw e;
        errors.push({
          job_id: input.job_id,
          batch_id: input.batch_id,
          product_key: p.key,
          stage: "products",
          message: e.message,
        });
      }
    }
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE);
    await svc.recordErrors(errors);
    await svc.touch(input.job_id);
    return new StepResponse(
      { items },
      { createdProductIds, createdMapKeys, source: input.source },
    );
  },
  // compensation: if a later step ultimately fails, remove only what THIS run created; the batch can then be retried cleanly
  async (comp, { container }) => {
    if (!comp) return;
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE);
    if (comp.createdProductIds.length) {
      await deleteProductsWorkflow(container).run({
        input: { ids: comp.createdProductIds },
      });
    }
    if (comp.createdMapKeys.length) {
      const maps = await svc.listImportProductMaps({
        source: comp.source,
        product_key: comp.createdMapKeys,
      });
      if (maps.length) await svc.deleteImportProductMaps(maps.map((m) => m.id));
    }
  },
);

class Upserter {
  private svc: ImportModuleService;
  private query: any;
  private pm: any;
  constructor(
    private container: MedusaContainer,
    private source: string,
    private currency: string,
    private tx: Taxonomy,
    private jobId: string,
  ) {
    this.svc = container.resolve(IMPORT_MODULE);
    this.query = container.resolve(ContainerRegistrationKeys.QUERY);
    this.pm = container.resolve(Modules.PRODUCT);
  }

  private async getProduct(id: string) {
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
    return data[0] as any | undefined;
  }

  /**
   * Matching order:
   *  1. product map (same product key imported before) -> that product
   *  2. otherwise a product that already owns one of these SKUs (pre-existing / earlier import / manual) -> updated by SKU
   *  3. otherwise a new product
   * Medusa requires unique SKUs, so two DIFFERENT products of the same CSV must not share a SKU. That used to
   * silently fold every product into the first one; it is now reported as a conflict and the product is skipped.
   */
  private async resolveExisting(p: NormalizedProduct) {
    const map = (
      await this.svc.listImportProductMaps({
        source: this.source,
        product_key: p.key,
      })
    )[0];
    const skus = p.variants.map((v) => v.sku);
    const hits = await this.findVariantsBySku(skus);
    const mapped = map ? await this.getProduct(map.product_id) : undefined;
    const foreign = [
      ...new Set((hits as any[]).map((h) => h.product_id as string)),
    ].filter((id) => id !== mapped?.id);

    if (mapped) {
      if (foreign.length)
        throw new ProductImportError(
          `SKU conflict: SKU(s) of this product already belong to a different product (${foreign.join(", ")})`,
        );
      return { map, product: mapped };
    }
    if (foreign.length > 1)
      throw new ProductImportError(
        `SKU conflict: the SKUs of this product belong to ${foreign.length} different existing products`,
      );
    if (foreign.length === 1) {
      const owner = await this.getProduct(foreign[0]);
      const shared = (hits as any[])
        .filter((h) => h.product_id === foreign[0])
        .map((h) => h.sku)
        .join(", ");
      if (
        owner?.metadata?.import_job_id === this.jobId &&
        owner.metadata.import_key !== p.key
      ) {
        throw new ProductImportError(
          `SKU conflict inside this CSV: SKU(s) [${shared}] are also used by product "${owner.metadata.import_key}". Medusa needs unique SKUs per variant; make them unique in the CSV.`,
        );
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
  private async findVariantsBySku(
    skus: string[],
  ): Promise<{ id: string; sku: string; product_id: string }[]> {
    const wanted = new Set(skus);
    const rows = (await this.pm.listProductVariants(
      { sku: skus },
      { select: ["id", "sku", "product_id"], take: null },
    )) as any[];
    return rows.filter((r) => r?.product_id && wanted.has(r.sku));
  }

  private variantPayload(v: NormalizedVariant) {
    return {
      title: v.title,
      sku: v.sku,
      manage_inventory: true,
      options: v.options,
      prices:
        v.price != null
          ? [{ amount: v.price, currency_code: this.currency }]
          : [],
      metadata: { attributes: v.attributes, import_source: this.source },
    };
  }

  async upsert(p: NormalizedProduct, imageUrls: string[]): Promise<UpsertItem> {
    const opts = this.svc.getOptions();
    const { map, product: existing } = await this.resolveExisting(p);
    // ids come from resolve-taxonomy (find-or-create, case-insensitive); a missing id means "not provided"
    const category_id = p.category
      ? this.tx.categories[catKey(p.category)]
      : undefined;
    const collection_id = p.collection_name
      ? this.tx.collections[nameKey(p.collection_name)]
      : undefined;
    const tag_id = p.brand_tag ? this.tx.tags[nameKey(p.brand_tag)] : undefined;
    if (p.category && !category_id)
      throw new ProductImportError(
        `category "${p.category}" could not be resolved`,
      );
    if (p.collection_name && !collection_id)
      throw new ProductImportError(
        `collection "${p.collection_name}" could not be resolved`,
      );
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

    let productId: string,
      created = false;
    if (!existing) {
      let handle = slug(p.title);
      const { data: clash } = await this.query.graph({
        entity: "product",
        fields: ["id"],
        filters: { handle },
      });
      if (clash.length) handle = `${handle}-${short(p.key)}`;
      const { result } = await createProductsWorkflow(this.container).run({
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
          ] as any,
        },
      });
      productId = (result as any[])[0].id;
      created = true;
    } else {
      productId = existing.id;
      const known = new Map<string, Set<string>>(
        existing.options.map((o: any) => [
          o.title,
          new Set<string>(o.values.map((x: any) => x.value)),
        ]),
      );
      const mergedOptions = [
        ...existing.options.map((o: any) => ({
          id: o.id,
          title: o.title,
          values: [
            ...new Set([
              ...known.get(o.title)!,
              ...(p.options.find((x) => x.title === o.title)?.values ?? []),
            ]),
          ],
        })),
        ...p.options
          .filter((o) => !known.has(o.title))
          .map((o) => ({ title: o.title, values: o.values })),
      ];
      await updateProductsWorkflow(this.container).run({
        input: {
          selector: { id: productId },
          update: {
            ...common,
            ...(tag_id
              ? {
                  tags: [
                    ...new Set([
                      ...(existing.tags ?? []).map((t: any) => t.id),
                      tag_id,
                    ]),
                  ].map((id) => ({ id })),
                }
              : {}),
            options: mergedOptions,
            metadata: { ...(existing.metadata ?? {}), ...metadata },
          } as any,
        },
      });
      const bySku = new Map<string, string>(
        existing.variants.map((v: any) => [v.sku, v.id]),
      );
      const toUpdate = p.variants.filter((v) => bySku.has(v.sku));
      const toCreate = p.variants.filter((v) => !bySku.has(v.sku));
      if (toCreate.length) {
        await createProductVariantsWorkflow(this.container).run({
          input: {
            product_variants: toCreate.map((v) => ({
              product_id: productId,
              ...this.variantPayload(v),
            })) as any,
          },
        });
      }
      if (toUpdate.length) {
        await updateProductVariantsWorkflow(this.container).run({
          input: {
            product_variants: toUpdate.map((v) => ({
              id: bySku.get(v.sku)!,
              title: v.title,
              prices: this.variantPayload(v).prices,
              metadata: this.variantPayload(v).metadata,
            })) as any,
          },
        });
      }
    }

    const fresh = await this.getProduct(productId);
    const variants: Record<string, string> = Object.fromEntries(
      fresh.variants.map((v: any) => [v.sku, v.id]),
    );
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
