"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const zod_1 = require("zod");
const constants_1 = require("../../../../../modules/import/constants");
const fresh_1 = require("../../../../../lib/fresh");
const config_check_1 = require("../../../../../lib/config-check");
const helpers_1 = require("../../helpers");
const Body = zod_1.z.object({
    mode: zod_1.z.enum(["merge", "fresh"]).default("merge"),
    confirm_deletion: zod_1.z.object({ token: zod_1.z.string(), confirm: zod_1.z.literal(true) }).optional(),
});
/** POST /admin/imports/:id/start - begin the import (merge by default; fresh needs a matching deletion-preview token) */
async function POST(req, res) {
    const body = Body.safeParse(req.body ?? {});
    if (!body.success)
        return void res.status(400).json({ message: body.error.issues.map((i) => i.message).join("; ") });
    const svc = req.scope.resolve(constants_1.IMPORT_MODULE);
    const job = await svc.retrieveImportJob(req.params.id);
    if (job.stage !== "preprocessed")
        return void res.status(409).json({ message: `Job is in stage "${job.stage}"; preprocess it first` });
    if (job.status === "processing")
        return void res.status(409).json({ message: "Job is already running" });
    await (0, config_check_1.validateImportConfig)(req.scope); // fail fast with a clear message
    if (body.data.mode === "fresh") {
        const preview = await (0, fresh_1.freshPreview)(req.scope, job.source);
        if (!body.data.confirm_deletion || body.data.confirm_deletion.token !== preview.token) {
            return void res.status(409).json({ message: "Fresh import requires confirmation of the current deletion preview", deletion_preview: preview });
        }
    }
    const updated = await svc.updateImportJobs({
        id: job.id, mode: body.data.mode, fresh_confirmed: body.data.mode === "fresh", status: "pending", stage: "importing", // the runner flips it to "processing"
    });
    await (0, helpers_1.emit)(req.scope, constants_1.EVENTS.RUN, job.id);
    res.status(202).json({ job: (0, helpers_1.serializeJob)(updated) });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydHMvW2lkXS9zdGFydC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWNBLG9CQW9CQztBQWpDRCw2QkFBdUI7QUFDdkIsdUVBQStFO0FBRS9FLG9EQUF1RDtBQUN2RCxrRUFBc0U7QUFDdEUsMkNBQWtEO0FBRWxELE1BQU0sSUFBSSxHQUFHLE9BQUMsQ0FBQyxNQUFNLENBQUM7SUFDcEIsSUFBSSxFQUFFLE9BQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ2pELGdCQUFnQixFQUFFLE9BQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUU7Q0FDdkYsQ0FBQyxDQUFBO0FBRUYseUhBQXlIO0FBQ2xILEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUE7SUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPO1FBQUUsT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDcEgsTUFBTSxHQUFHLEdBQXdCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHlCQUFhLENBQUMsQ0FBQTtJQUNqRSxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3RELElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxjQUFjO1FBQUUsT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixHQUFHLENBQUMsS0FBSyx3QkFBd0IsRUFBRSxDQUFDLENBQUE7SUFDdEksSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFlBQVk7UUFBRSxPQUFPLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQ3hHLE1BQU0sSUFBQSxtQ0FBb0IsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUEsQ0FBQyxpQ0FBaUM7SUFFdkUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUMvQixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEYsT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLG9FQUFvRSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEosQ0FBQztJQUNILENBQUM7SUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUN6QyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsc0NBQXNDO0tBQzdKLENBQUMsQ0FBQTtJQUNGLE1BQU0sSUFBQSxjQUFJLEVBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxrQkFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDekMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBQSxzQkFBWSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUN0RCxDQUFDIn0=