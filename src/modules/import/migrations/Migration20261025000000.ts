import { Migration } from "@mikro-orm/migrations"

/**
 * Superseded. The first release created generically named tables ("import_job", ...) that could
 * collide with tables from other code. Kept as a no-op so databases that already recorded it stay consistent.
 * Real schema: Migration20261025000001.
 */
export class Migration20261025000000 extends Migration {
  override async up(): Promise<void> {}
  override async down(): Promise<void> {}
}
