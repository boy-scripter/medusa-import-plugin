# medusa-plugin-product-import

Resilient CSV product import for **Medusa v2**: native Admin UI, CSV -> normalized JSON preprocessing, batches of 10 products, DB-backed checkpoints, built-in workflow retries/compensation, and an admin **Continue job** button.

> **Verify against your Medusa version.** This plugin targets Medusa `^2.8`. It was written against the documented v2 APIs but not executed against a live install. Before production, run the tests, run one 20-product import on staging, and check the "Version-sensitive spots" section below.

## Install

```bash
npm i medusa-plugin-product-import      # or yarn/pnpm, or `npm i ../this-folder` while developing
```

`medusa-config.ts`:

```ts
module.exports = defineConfig({
  plugins: [{ resolve: "medusa-plugin-product-import", options: {} }],
  modules: [
    {
      resolve: "medusa-plugin-product-import/modules/import",   // or "./modules/import" if you copy the module in
      options: {
        prefix_upload: "product-sheet",
        price_list_id: process.env.IMPORT_PRICE_LIST_ID,        // dealer prices
        sales_channel_id: process.env.IMPORT_SALES_CHANNEL_ID,
        shipping_profile_id: process.env.IMPORT_SHIPPING_PROFILE_ID,
      },
    },
  ],
})
```

Then `npx medusa db:migrate`. Requirements: a configured **File module provider** (local, S3, ...), the sales channel must be linked to at least one **stock location**, and the store needs a default currency. Event bus: local (dev) or Redis (prod) both work.

| Option | Purpose |
|---|---|
| `prefix_upload` | Path prefix for source CSVs (`<prefix>/source/<job>/`) and processed parts (`<prefix>/processed/<job>/`). Also the **import source** that scopes fresh-mode deletion. |
| `price_list_id` | Price list receiving `dealer_price` entries. |
| `sales_channel_id` | Attached to created products; its stock location receives inventory. |
| `shipping_profile_id` | Attached to created products. |

Options and the existence of all three IDs are validated before every preprocess/start; nothing is hardcoded and no config or file URLs are returned by the API.

## CSV contract

Required headers: `title`, `variant_sku`. All 39 documented columns are supported, and **options/attributes are discovered**, not hardcoded: any `option_<n>_name/_value` and `attribute_<n>_name/_value` pair works for any `n`.

**Grouping strategy:** product key = normalized `title` + `|` + normalized `brand_tag`. A row with a blank `title` belongs to the previous row's product. Product-level fields take the first non-empty value; images are merged across rows.
**Sorting:** rows are hash-bucketed to disk, grouped per bucket and ordered by product key, so output is deterministic and memory is bounded.
**Validation:** a row is rejected (error) for: missing SKU, duplicate SKU in product, missing option value, duplicate option combination, invalid price. Warnings: missing price, bad dealer price/quantity/image URL, unknown status (-> `draft`). With no option columns a single synthetic option `Variant` (value = SKU) is created.
**Attributes:** all attributes from the first variant are used as product attributes. All variant attributes are cleared (set to empty object). Stored in `metadata.attributes`. `brand_tag` becomes a product tag; `category` accepts `Parent > Child`; collections/categories/tags are created if missing.

Normalized output is NDJSON in parts of 500 products stored through the File module; each batch addresses 10 products inside a part.

## Flow and persistence

`upload -> preprocess -> (preview) -> start -> batches -> completed`

Tables: `import_job` (stage, status, counters, heartbeat), `import_batch` (checkpoint per 10 products), `import_error`, `import_product_map` (product key -> product id, idempotency + fresh scope), `import_image_map` (source URL -> uploaded file).

Each batch is the workflow `import-product-batch`: load -> upload images (`uploadFilesWorkflow`, reuses mapped images) -> create/update products and variants (core flows) -> dealer price-list entries (`batchPriceListPricesWorkflow`) -> stock (`batchInventoryItemLevelsWorkflow`) -> **checkpoint**. Steps use Medusa's `maxRetries`/`retryInterval`; the product step has a compensation that deletes only products created by that run. No external retry library or queue is used.

Idempotency: products are matched by product map, then by SKU (existing products adopted); prices and stock levels are compared before writing; images are looked up before upload; a SKU owned by a different product is reported as a duplicate-SKU error.

## Admin API (all under `/admin/imports`, admin-authenticated by Medusa)

| Method / path | Purpose |
|---|---|
| `POST /` (multipart `file`) | Upload CSV, create job |
| `GET /`, `GET /:id`, `GET /:id/errors` | List jobs, inspect job/batches/errors |
| `POST /:id/preprocess` | Start preprocessing (202) |
| `GET /:id/preview[?mode=fresh]` | Sample products; with `fresh`, deletion preview + token |
| `POST /:id/start` `{mode, confirm_deletion?}` | Start import (202) |
| `POST /:id/retry` `{batch_id?}` | Re-queue failed batches |
| `POST /:id/continue` | Resume an interrupted/failed job |

**Fresh mode** deletes only products recorded in `import_product_map` for this `prefix_upload` that also carry `metadata.import_source` for it. `start` with `mode: "fresh"` is refused (409) unless `confirm_deletion.token` matches the current preview. Deleting products does not purge uploaded image files.

## Recovery

- A job is **interrupted** when it is `processing` but its heartbeat is older than 5 minutes (server crash/restart). The UI shows an "interrupted" badge; nothing auto-resumes.
- Click **Continue job** (or `POST /:id/continue`). Completed batches are never re-run; a batch that was mid-flight is reconciled by the idempotent steps (product map, SKU match, price/stock comparison, image map) and finished.
- Interrupted during preprocessing: Continue restarts preprocessing (it wipes its own earlier artifacts first).
- Failed batches (after step retries) are listed with errors; fix the cause and **Retry failed batches**.
- Checkpoints are written only after a batch fully completes. Heartbeat is ~per step; a single image download can take up to 20s.
- Scale-out note: the in-process guard plus heartbeat prevent double runs on one node; for multiple server instances, run imports on a single worker instance.

## Version-sensitive spots

Check these against your installed version if something misbehaves: `FileStore` (`src/lib/file-store.ts`: file-module read APIs vary), `updateProductsWorkflow` option merging for existing products, `batchPriceListPricesWorkflow`/`batchInventoryItemLevelsWorkflow` input shapes, `retryInterval` semantics, and the hand-written migration (replace with `npx medusa plugin:db:generate` output if it differs).

## Development

```bash
npm run test:unit                    # grouping, validation, options
npm run test:integration:modules     # needs Postgres (see Medusa test docs)
npm run build                        # medusa plugin:build
```
Limits: 100 MB CSV upload; images up to 15 MB; private/internal image hosts are blocked.
