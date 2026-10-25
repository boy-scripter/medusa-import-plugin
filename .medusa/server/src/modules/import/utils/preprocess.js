"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessCsv = preprocessCsv;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const events_1 = require("events");
const csv_parse_1 = require("csv-parse");
const group_1 = require("./group");
const constants_1 = require("../constants");
const REQUIRED = ["title", "variant_sku"];
/**
 * Two-pass, bounded-memory preprocessing.
 *  1. Stream CSV; forward-fill blank titles; hash product key into N bucket files on disk.
 *  2. Per bucket: group, stable-sort by product key, build products, emit in parts of PART_SIZE.
 * Output order is deterministic (bucket, then product key).
 */
async function preprocessCsv(opts) {
    const N = opts.buckets ?? 64;
    const partSize = opts.partSize ?? constants_1.PART_SIZE;
    const dir = path_1.default.join(opts.workDir, "buckets");
    await fs_1.default.promises.mkdir(dir, { recursive: true });
    const streams = new Map();
    const write = async (b, line) => {
        let s = streams.get(b);
        if (!s) {
            s = fs_1.default.createWriteStream(path_1.default.join(dir, `b${b}.ndjson`));
            streams.set(b, s);
        }
        if (!s.write(line))
            await (0, events_1.once)(s, "drain");
    };
    let rows = 0, skipped = 0, prevKey = null;
    let pending = [];
    const flushIssues = async (force = false) => {
        if (pending.length && (force || pending.length >= 200)) {
            const p = pending;
            pending = [];
            await opts.onIssues(p);
        }
    };
    const parser = fs_1.default.createReadStream(opts.csvPath).pipe((0, csv_parse_1.parse)({
        columns: (h) => {
            const cols = h.map((x) => x.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_"));
            const missing = REQUIRED.filter((c) => !cols.includes(c));
            if (missing.length)
                throw new Error(`CSV is missing required column(s): ${missing.join(", ")}`);
            return cols;
        },
        bom: true, skip_empty_lines: true, trim: true, relax_column_count: true, relax_quotes: true,
    }));
    for await (const rec of parser) {
        rows++;
        const n = rows + 1; // line number incl. header
        const title = (rec.title ?? "").trim();
        let key;
        if (title)
            key = (0, group_1.productKey)(title, rec.brand_tag);
        else if (prevKey)
            key = prevKey;
        else {
            skipped++;
            pending.push({ row: n, product_key: null, severity: "error", message: "row has no title and no previous product" });
            continue;
        }
        prevKey = key;
        if (!title)
            rec.title = ""; // title resolved at group time from the product's first row
        await write((0, group_1.bucketOf)(key, N), JSON.stringify({ key, n, r: rec }) + "\n");
        await flushIssues();
        if (rows % 2000 === 0)
            await opts.onTick?.();
    }
    await Promise.all([...streams.values()].map((s) => new Promise((res) => s.end(res))));
    await flushIssues(true);
    if (rows === 0)
        throw new Error("CSV contains no data rows");
    // pass 2
    let part = [], partIndex = 0, products = 0, variants = 0;
    const emit = async (force) => {
        if (part.length && (force || part.length >= partSize)) {
            const p = part;
            part = [];
            await opts.onPart({ index: partIndex++, products: p });
        }
    };
    for (let b = 0; b < N; b++) {
        const file = path_1.default.join(dir, `b${b}.ndjson`);
        if (!fs_1.default.existsSync(file))
            continue;
        const groups = new Map();
        const rl = readline_1.default.createInterface({ input: fs_1.default.createReadStream(file), crlfDelay: Infinity });
        for await (const line of rl) {
            if (!line)
                continue;
            const { key, n, r } = JSON.parse(line);
            const g = groups.get(key) ?? [];
            g.push({ n, r });
            groups.set(key, g);
        }
        for (const key of [...groups.keys()].sort()) {
            const { product, issues } = (0, group_1.buildProduct)(key, groups.get(key));
            pending.push(...issues);
            if (product) {
                part.push(product);
                products++;
                variants += product.variants.length;
            }
            await flushIssues();
            await emit(false);
            if (products % 200 === 0)
                await opts.onTick?.();
        }
        await fs_1.default.promises.rm(file, { force: true });
    }
    await emit(true);
    await flushIssues(true);
    return { total_rows: rows, total_products: products, total_variants: variants, skipped_rows: skipped };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlcHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC91dGlscy9wcmVwcm9jZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBa0JBLHNDQXVGQztBQXpHRCw0Q0FBbUI7QUFDbkIsZ0RBQXVCO0FBQ3ZCLHdEQUErQjtBQUMvQixtQ0FBNkI7QUFDN0IseUNBQWlDO0FBQ2pDLG1DQUF5RTtBQUV6RSw0Q0FBd0M7QUFHeEMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFFekM7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUFDLElBU25DO0lBQ0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUE7SUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxxQkFBUyxDQUFBO0lBQzNDLE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUM5QyxNQUFNLFlBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUEwQixDQUFBO0lBQ2pELE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxDQUFTLEVBQUUsSUFBWSxFQUFFLEVBQUU7UUFDOUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN0QixJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFBQyxDQUFDLEdBQUcsWUFBRSxDQUFDLGlCQUFpQixDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFBQyxDQUFDO1FBQ3ZGLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztZQUFFLE1BQU0sSUFBQSxhQUFJLEVBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzVDLENBQUMsQ0FBQTtJQUVELElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBa0IsSUFBSSxDQUFBO0lBQ3hELElBQUksT0FBTyxHQUFZLEVBQUUsQ0FBQTtJQUN6QixNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsS0FBSyxHQUFHLEtBQUssRUFBRSxFQUFFO1FBQzFDLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQUMsQ0FBQztJQUNySCxDQUFDLENBQUE7SUFFRCxNQUFNLE1BQU0sR0FBRyxZQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FDbkQsSUFBQSxpQkFBSyxFQUFDO1FBQ0osT0FBTyxFQUFFLENBQUMsQ0FBVyxFQUFFLEVBQUU7WUFDdkIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQzdGLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3pELElBQUksT0FBTyxDQUFDLE1BQU07Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDL0YsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBQ0QsR0FBRyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUk7S0FDNUYsQ0FBQyxDQUNILENBQUE7SUFDRCxJQUFJLEtBQUssRUFBRSxNQUFNLEdBQUcsSUFBSSxNQUErQyxFQUFFLENBQUM7UUFDeEUsSUFBSSxFQUFFLENBQUE7UUFDTixNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFBLENBQUMsMkJBQTJCO1FBQzlDLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUN0QyxJQUFJLEdBQVcsQ0FBQTtRQUNmLElBQUksS0FBSztZQUFFLEdBQUcsR0FBRyxJQUFBLGtCQUFVLEVBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUM1QyxJQUFJLE9BQU87WUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFBO2FBQzFCLENBQUM7WUFBQyxPQUFPLEVBQUUsQ0FBQztZQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsMENBQTBDLEVBQUUsQ0FBQyxDQUFDO1lBQUMsU0FBUTtRQUFDLENBQUM7UUFDakosT0FBTyxHQUFHLEdBQUcsQ0FBQTtRQUNiLElBQUksQ0FBQyxLQUFLO1lBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUEsQ0FBQyw0REFBNEQ7UUFDdkYsTUFBTSxLQUFLLENBQUMsSUFBQSxnQkFBUSxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUN4RSxNQUFNLFdBQVcsRUFBRSxDQUFBO1FBQ25CLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDO1lBQUUsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQTtJQUM5QyxDQUFDO0lBQ0QsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzNGLE1BQU0sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZCLElBQUksSUFBSSxLQUFLLENBQUM7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUE7SUFFNUQsU0FBUztJQUNULElBQUksSUFBSSxHQUF3QixFQUFFLEVBQUUsU0FBUyxHQUFHLENBQUMsRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUE7SUFDN0UsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEtBQWMsRUFBRSxFQUFFO1FBQ3BDLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDdEQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtZQUN6QixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDeEQsQ0FBQztJQUNILENBQUMsQ0FBQTtJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQUUsU0FBUTtRQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQTtRQUMxQyxNQUFNLEVBQUUsR0FBRyxrQkFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDOUYsSUFBSSxLQUFLLEVBQUUsTUFBTSxJQUFJLElBQUksRUFBRSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUk7Z0JBQUUsU0FBUTtZQUNuQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3RDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQy9CLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3RDLENBQUM7UUFDRCxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQzVDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBQSxvQkFBWSxFQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUE7WUFDL0QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZCLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFBQyxRQUFRLEVBQUUsQ0FBQztnQkFBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUE7WUFBQyxDQUFDO1lBQ3BGLE1BQU0sV0FBVyxFQUFFLENBQUM7WUFBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUN0QyxJQUFJLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQztnQkFBRSxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFBO1FBQ2pELENBQUM7UUFDRCxNQUFNLFlBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLENBQUM7SUFDRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNoQixNQUFNLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2QixPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFBO0FBQ3hHLENBQUMifQ==