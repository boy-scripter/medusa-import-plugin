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
const hash = (u) => crypto_1.default.createHash("sha1").update(u).digest("hex");
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
            const base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "image")
                .replace(/[^\w.\-]+/g, "_")
                .slice(-60);
            const { result } = await (0, core_flows_1.uploadFilesWorkflow)(container).run({
                input: {
                    files: [
                        {
                            filename: `${hash(url).slice(0, 12)}-${base}`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkLWltYWdlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3RlcHMvdXBsb2FkLWltYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFXQSxzQ0FVQztBQXJCRCxvREFBNEI7QUFDNUIscUVBQTZFO0FBQzdFLDREQUFrRTtBQUNsRSw4REFBK0Q7QUFJL0QsTUFBTSxTQUFTLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbkMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLGdCQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUUsMEZBQTBGO0FBQzFGLFNBQWdCLGFBQWEsQ0FBQyxJQUFZO0lBQ3hDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QixPQUFPLENBQ0wsQ0FBQyxLQUFLLFdBQVc7UUFDakIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDcEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDdkIsMEVBQTBFLENBQUMsSUFBSSxDQUM3RSxDQUFDLENBQ0YsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsR0FBVztJQUNuQyxNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDNUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcs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