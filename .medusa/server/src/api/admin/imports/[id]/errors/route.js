"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const constants_1 = require("../../../../../modules/import/constants");
/** GET /admin/imports/:id/errors?limit=&offset=&severity=error|warning&stage= */
async function GET(req, res) {
    const svc = req.scope.resolve(constants_1.IMPORT_MODULE);
    const limit = Math.min(Number(req.query.limit ?? 50), 200), offset = Number(req.query.offset ?? 0);
    const filters = { job_id: req.params.id };
    if (req.query.severity === "error" || req.query.severity === "warning")
        filters.severity = req.query.severity;
    if (typeof req.query.stage === "string")
        filters.stage = req.query.stage;
    const [errors, count] = await svc.listAndCountImportErrors(filters, { order: { created_at: "DESC" }, take: limit, skip: offset });
    res.json({ errors, count, limit, offset });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydHMvW2lkXS9lcnJvcnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFLQSxrQkFRQztBQVpELHVFQUF1RTtBQUd2RSxpRkFBaUY7QUFDMUUsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sR0FBRyxHQUF3QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBYSxDQUFDLENBQUE7SUFDakUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUNsRyxNQUFNLE9BQU8sR0FBNEIsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQTtJQUNsRSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQTtJQUM3RyxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssUUFBUTtRQUFFLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUE7SUFDeEUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUNqSSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtBQUM1QyxDQUFDIn0=