import { Migration } from "@mikro-orm/migrations"

/**
 * Namespaced tables (product_import_*). Deliberately NOT "if not exists": if a table with the
 * same name already exists with a different shape this must fail loudly instead of being skipped.
 * If your Medusa version generates a different snapshot, run `npx medusa plugin:db:generate`.
 */
export class Migration20261025000001 extends Migration {
  override async up(): Promise<void> {
    const ts = `"created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null`
    this.addSql(`create table "product_import_job" (
      "id" text not null, "source" text not null, "filename" text null,
      "mode" text check ("mode" in ('merge','fresh')) not null default 'merge',
      "stage" text check ("stage" in ('uploaded','preprocessing','preprocessed','importing','completed')) not null default 'uploaded',
      "status" text check ("status" in ('pending','processing','paused','completed','completed_with_errors','failed')) not null default 'pending',
      "source_file_id" text null, "parts" jsonb null,
      "total_rows" integer not null default 0, "total_products" integer not null default 0, "total_variants" integer not null default 0,
      "total_batches" integer not null default 0, "completed_batches" integer not null default 0,
      "processed_products" integer not null default 0, "failed_products" integer not null default 0,
      "fresh_confirmed" boolean not null default false, "fresh_cleanup_done" boolean not null default false,
      "heartbeat_at" timestamptz null, "last_error" text null, ${ts}, constraint "product_import_job_pkey" primary key ("id"));`)
    this.addSql(`create index "IDX_product_import_job_deleted_at" on "product_import_job" ("deleted_at") where deleted_at is null;`)

    this.addSql(`create table "product_import_batch" (
      "id" text not null, "job_id" text not null, "idx" integer not null, "part_file_id" text not null,
      "start_line" integer not null, "size" integer not null,
      "status" text check ("status" in ('pending','processing','completed','failed')) not null default 'pending',
      "attempts" integer not null default 0, "failed_count" integer not null default 0,
      "product_keys" jsonb null, "error" text null, ${ts}, constraint "product_import_batch_pkey" primary key ("id"));`)
    this.addSql(`create index "IDX_product_import_batch_job_id" on "product_import_batch" ("job_id") where deleted_at is null;`)
    this.addSql(`create unique index "IDX_product_import_batch_job_idx_unique" on "product_import_batch" ("job_id","idx") where deleted_at is null;`)

    this.addSql(`create table "product_import_error" (
      "id" text not null, "job_id" text not null, "batch_id" text null, "product_key" text null, "row_number" integer null,
      "stage" text not null, "severity" text check ("severity" in ('error','warning')) not null default 'error',
      "message" text not null, ${ts}, constraint "product_import_error_pkey" primary key ("id"));`)
    this.addSql(`create index "IDX_product_import_error_job_id" on "product_import_error" ("job_id") where deleted_at is null;`)
    this.addSql(`create index "IDX_product_import_error_batch_id" on "product_import_error" ("batch_id") where deleted_at is null;`)

    this.addSql(`create table "product_import_product_map" (
      "id" text not null, "source" text not null, "product_key" text not null, "product_id" text not null,
      "variant_ids" jsonb null, ${ts}, constraint "product_import_product_map_pkey" primary key ("id"));`)
    this.addSql(`create index "IDX_product_import_product_map_product_id" on "product_import_product_map" ("product_id") where deleted_at is null;`)
    this.addSql(`create unique index "IDX_product_import_product_map_source_key_unique" on "product_import_product_map" ("source","product_key") where deleted_at is null;`)

    this.addSql(`create table "product_import_image_map" (
      "id" text not null, "source" text not null, "url_hash" text not null, "source_url" text not null,
      "file_id" text not null, "file_url" text not null, ${ts}, constraint "product_import_image_map_pkey" primary key ("id"));`)
    this.addSql(`create unique index "IDX_product_import_image_map_source_hash_unique" on "product_import_image_map" ("source","url_hash") where deleted_at is null;`)
  }

  override async down(): Promise<void> {
    for (const t of ["image_map", "product_map", "error", "batch", "job"]) {
      this.addSql(`drop table if exists "product_import_${t === "product_map" ? "product_map" : t}" cascade;`)
    }
  }
}
