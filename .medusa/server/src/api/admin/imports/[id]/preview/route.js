"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const constants_1 = require("../../../../../modules/import/constants");
const file_store_1 = require("../../../../../lib/file-store");
const fresh_1 = require("../../../../../lib/fresh");
const helpers_1 = require("../../helpers");
/** GET /admin/imports/:id/preview[?mode=fresh] - sample of normalized products; with mode=fresh also the deletion preview + confirmation token */
async function GET(req, res) {
    const svc = req.scope.resolve(constants_1.IMPORT_MODULE);
    const job = await svc.retrieveImportJob(req.params.id);
    const parts = job.parts ?? [];
    let sample = [];
    if (parts.length) {
        try {
            const buf = await new file_store_1.FileStore(req.scope).getBuffer(parts[0].file_id);
            sample = buf.toString("utf8").split("\n").filter(Boolean).slice(0, 5).map((l) => JSON.parse(l));
        }
        catch (e) {
            req.scope.resolve("logger").warn(`product-import: could not read preview sample: ${e?.message ?? e}`);
        }
    }
    const [, warning_count] = await svc.listAndCountImportErrors({ job_id: job.id, severity: "warning" }, { take: 1 });
    const [, error_count] = await svc.listAndCountImportErrors({ job_id: job.id, severity: "error" }, { take: 1 });
    res.json({
        job: (0, helpers_1.serializeJob)(job), sample, warning_count, error_count,
        ...(req.query.mode === "fresh" ? { deletion_preview: await (0, fresh_1.freshPreview)(req.scope, job.source) } : {}),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydHMvW2lkXS9wcmV2aWV3L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsa0JBbUJDO0FBMUJELHVFQUF1RTtBQUV2RSw4REFBeUQ7QUFDekQsb0RBQXVEO0FBQ3ZELDJDQUE0QztBQUU1QyxrSkFBa0o7QUFDM0ksS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sR0FBRyxHQUF3QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBYSxDQUFDLENBQUE7SUFDakUsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0RCxNQUFNLEtBQUssR0FBSSxHQUFHLENBQUMsS0FBc0MsSUFBSSxFQUFFLENBQUE7SUFDL0QsSUFBSSxNQUFNLEdBQWMsRUFBRSxDQUFBO0lBQzFCLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3RFLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNqRyxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNoQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN2RyxDQUFDO0lBQ0gsQ0FBQztJQUNELE1BQU0sQ0FBQyxFQUFFLGFBQWEsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbEgsTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsd0JBQXdCLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUM5RyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsR0FBRyxFQUFFLElBQUEsc0JBQVksRUFBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFdBQVc7UUFDMUQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDdkcsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9