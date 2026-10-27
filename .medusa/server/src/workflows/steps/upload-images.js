"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImagesStep = void 0;
exports.isBlockedHost = isBlockedHost;
const crypto_1 = __importDefault(require("crypto"));
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const constants_1 = require("../../modules/import/constants");
const MAX_BYTES = 15 * 1024 * 1024;
// "v2|" salt: image-map rows from earlier releases (possibly corrupt uploads) are ignored and re-uploaded
const hash = (u) => crypto_1.default
    .createHash("sha1")
    .update("v2|" + u)
    .digest("hex");
const EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
};
/** Basic SSRF guard: CSV is admin supplied, but block obvious internal targets anyway. */
function isBlockedHost(host) {
    const h = host.toLowerCase();
    return (h === "localhost" ||
        h.endsWith(".local") ||
        h.endsWith(".internal") ||
        /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/.test(h));
}
async function fetchImage(url) {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname))
        throw new Error("image URL not allowed");
    const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        redirect: "follow",
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!type.startsWith("image/"))
        throw new Error(`not an image (${type || "unknown type"})`);
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES)
        throw new Error("image too large");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES)
        throw new Error("image too large");
    return { buf, type };
}
/** Uploads one image at a time (bounded memory) via uploadFilesWorkflow; reuses images already uploaded. */
exports.uploadImagesStep = (0, workflows_sdk_1.createStep)({ name: "import-upload-images", maxRetries: 2, retryInterval: 3 }, async (input, { container }) => {
    const svc = container.resolve(constants_1.IMPORT_MODULE);
    const opts = svc.getOptions();
    const urls = [...new Set(input.products.flatMap((p) => p.images))];
    const images = {};
    const failed = {};
    if (urls.length) {
        const existing = await svc.listImportImageMaps({ source: input.source, url_hash: urls.map(hash) }, { take: null });
        for (const m of existing)
            images[m.source_url] = m.file_url;
    }
    for (const url of urls) {
        if (images[url])
            continue;
        try {
            const { buf, type } = await fetchImage(url);
            let base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "image")
                .replace(/[^\w.\-]+/g, "_")
                .slice(-60);
            if (!/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(base))
                base += `.${EXT[type] ?? "png"}`;
            const { result } = await (0, core_flows_1.uploadFilesWorkflow)(container).run({
                input: {
                    files: [
                        {
                            filename: `${opts.image_path_prefix}/${hash(url).slice(0, 12)}-${base}`,
                            mimeType: type,
                            content: buf.toString("base64"),
                            access: "public",
                        },
                    ],
                },
            });
            const f = result[0];
            await svc.createImportImageMaps([
                {
                    source: input.source,
                    url_hash: hash(url),
                    source_url: url,
                    file_id: f.id,
                    file_url: f.url,
                },
            ]);
            images[url] = f.url;
            await svc.touch(input.job_id);
        }
        catch (e) {
            failed[url] = String(e?.message ?? e);
        }
    }
    await svc.recordErrors(input.products.flatMap((p) => p.images
        .filter((u) => failed[u])
        .map((u) => ({
        job_id: input.job_id,
        batch_id: input.batch_id,
        product_key: p.key,
        stage: "images",
        message: `image ${u}: ${failed[u]}`,
    }))));
    return new workflows_sdk_1.StepResponse({ images });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLWltYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3RlcHMvdXBsb2FkLWltYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUF5QkEsc0NBVUM7QUFuQ0Qsb0RBQTRCO0FBQzVCLHFFQUE2RTtBQUM3RSw0REFBa0U7QUFDbEUsOERBQStEO0FBSy9ELE1BQU0sU0FBUyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ25DLDBHQUEwRztBQUMxRyxNQUFNLElBQUksR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQ3pCLGdCQUFNO0tBQ0gsVUFBVSxDQUFDLE1BQU0sQ0FBQztLQUNsQixNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztLQUNqQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkIsTUFBTSxHQUFHLEdBQTJCO0lBQ2xDLFdBQVcsRUFBRSxLQUFLO0lBQ2xCLFlBQVksRUFBRSxLQUFLO0lBQ25CLFlBQVksRUFBRSxNQUFNO0lBQ3BCLFdBQVcsRUFBRSxLQUFLO0lBQ2xCLGVBQWUsRUFBRSxLQUFLO0lBQ3RCLFlBQVksRUFBRSxNQUFNO0NBQ3JCLENBQUM7QUFFRiwwRkFBMEY7QUFDMUYsU0FBZ0IsYUFBYSxDQUFDLElBQVk7SUFDeEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzdCLE9BQU8sQ0FDTCxDQUFDLEtBQUssV0FBVztRQUNqQixDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUNwQixDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUN2QiwwRUFBMEUsQ0FBQyxJQUFJLENBQzdFLENBQUMsQ0FDRixDQUNGLENBQUM7QUFDSixDQUFDO0FBRUQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxHQUFXO0lBQ25DLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcs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