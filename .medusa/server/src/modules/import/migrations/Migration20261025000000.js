"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20261025000000 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
/**
 * Superseded. The first release created generically named tables ("import_job", ...) that could
 * collide with tables from other code. Kept as a no-op so databases that already recorded it stay consistent.
 * Real schema: Migration20261025000001.
 */
class Migration20261025000000 extends migrations_1.Migration {
    async up() { }
    async down() { }
}
exports.Migration20261025000000 = Migration20261025000000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjEwMjUwMDAwMDAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9pbXBvcnQvbWlncmF0aW9ucy9NaWdyYXRpb24yMDI2MTAyNTAwMDAwMC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzREFBaUQ7QUFFakQ7Ozs7R0FJRztBQUNILE1BQWEsdUJBQXdCLFNBQVEsc0JBQVM7SUFDM0MsS0FBSyxDQUFDLEVBQUUsS0FBbUIsQ0FBQztJQUM1QixLQUFLLENBQUMsSUFBSSxLQUFtQixDQUFDO0NBQ3hDO0FBSEQsMERBR0MifQ==