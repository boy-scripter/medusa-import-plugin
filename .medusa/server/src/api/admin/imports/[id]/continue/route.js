"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const constants_1 = require("../../../../../modules/import/constants");
const helpers_1 = require("../../helpers");
const runner_1 = require("../../../../../lib/runner");
/**
 * POST /admin/imports/:id/continue - the "Continue Job" action.
 * Allowed for interrupted jobs (processing without heartbeat), failed or paused jobs.
 * Resumes from the last DB checkpoint: completed batches are never re-run.
 */
async function POST(req, res) {
    const svc = req.scope.resolve(constants_1.IMPORT_MODULE);
    const job = await svc.retrieveImportJob(req.params.id);
    const resumable = (0, runner_1.isStale)(job) || ["failed", "paused"].includes(job.status);
    if (!resumable)
        return void res.status(409).json({ message: `Job is "${job.status}" and cannot be continued` });
    if (job.stage === "uploaded")
        return void res.status(409).json({ message: "Nothing to continue: preprocess the job first" });
    const preprocessing = job.stage === "preprocessing";
    // batches that were mid-flight stay "processing"; the runner treats them as pending and every step reconciles first
    // importing: queue as "pending" (a fresh heartbeat would make the runner think another worker is alive)
    const updated = await svc.updateImportJobs(preprocessing
        ? { id: job.id, status: "processing", heartbeat_at: new Date(), last_error: null }
        : { id: job.id, status: "pending", stage: "importing", last_error: null });
    await (0, helpers_1.emit)(req.scope, preprocessing ? constants_1.EVENTS.PREPROCESS : constants_1.EVENTS.RUN, job.id);
    res.status(202).json({ job: (0, helpers_1.serializeJob)(updated), resumed_stage: preprocessing ? "preprocessing" : "importing" });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydHMvW2lkXS9jb250aW51ZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLG9CQWlCQztBQTNCRCx1RUFBK0U7QUFFL0UsMkNBQWtEO0FBQ2xELHNEQUFtRDtBQUVuRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sR0FBRyxHQUF3QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBYSxDQUFDLENBQUE7SUFDakUsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0RCxNQUFNLFNBQVMsR0FBRyxJQUFBLGdCQUFPLEVBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMzRSxJQUFJLENBQUMsU0FBUztRQUFFLE9BQU8sS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEdBQUcsQ0FBQyxNQUFNLDJCQUEyQixFQUFFLENBQUMsQ0FBQTtJQUMvRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssVUFBVTtRQUFFLE9BQU8sS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSwrQ0FBK0MsRUFBRSxDQUFDLENBQUE7SUFFNUgsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLEtBQUssS0FBSyxlQUFlLENBQUE7SUFDbkQsb0hBQW9IO0lBQ3BILHdHQUF3RztJQUN4RyxNQUFNLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FDeEMsYUFBYTtRQUNYLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtRQUNsRixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUM1RSxDQUFBO0lBQ0QsTUFBTSxJQUFBLGNBQUksRUFBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsa0JBQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLGtCQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUM3RSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFBLHNCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFBO0FBQ3BILENBQUMifQ==