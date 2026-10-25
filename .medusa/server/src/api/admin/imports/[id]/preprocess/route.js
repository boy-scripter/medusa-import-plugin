"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const constants_1 = require("../../../../../modules/import/constants");
const helpers_1 = require("../../helpers");
const runner_1 = require("../../../../../lib/runner");
/** POST /admin/imports/:id/preprocess - starts preprocessing in the background (202) */
async function POST(req, res) {
    const svc = req.scope.resolve(constants_1.IMPORT_MODULE);
    const job = await svc.retrieveImportJob(req.params.id);
    if (job.stage === "importing" || job.stage === "completed")
        return void res.status(409).json({ message: "Job already imported products; upload a new CSV instead" });
    if (job.status === "processing" && !(0, runner_1.isStale)(job))
        return void res.status(409).json({ message: "Job is already running" });
    svc.getOptions();
    const updated = await svc.updateImportJobs({ id: job.id, stage: "preprocessing", status: "processing", heartbeat_at: new Date(), last_error: null });
    await (0, helpers_1.emit)(req.scope, constants_1.EVENTS.PREPROCESS, job.id);
    res.status(202).json({ job: (0, helpers_1.serializeJob)(updated) });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydHMvW2lkXS9wcmVwcm9jZXNzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT0Esb0JBU0M7QUFmRCx1RUFBK0U7QUFFL0UsMkNBQWtEO0FBQ2xELHNEQUFtRDtBQUVuRCx3RkFBd0Y7QUFDakYsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sR0FBRyxHQUF3QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBYSxDQUFDLENBQUE7SUFDakUsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0RCxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssV0FBVyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssV0FBVztRQUFFLE9BQU8sS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5REFBeUQsRUFBRSxDQUFDLENBQUE7SUFDcEssSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFlBQVksSUFBSSxDQUFDLElBQUEsZ0JBQU8sRUFBQyxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQ3pILEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUNoQixNQUFNLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNwSixNQUFNLElBQUEsY0FBSSxFQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsa0JBQU0sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUEsc0JBQVksRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDdEQsQ0FBQyJ9