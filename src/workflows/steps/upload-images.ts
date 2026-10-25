import crypto from "crypto";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { IMPORT_MODULE } from "../../modules/import/constants";
import type ImportModuleService from "../../modules/import/service";
import type { NormalizedProduct } from "../../modules/import/types";

const MAX_BYTES = 15 * 1024 * 1024;
// "v2|" salt: image-map rows from earlier releases (possibly corrupt uploads) are ignored and re-uploaded
const hash = (u: string) =>
  crypto
    .createHash("sha1")
    .update("v2|" + u)
    .digest("hex");
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/** Basic SSRF guard: CSV is admin supplied, but block obvious internal targets anyway. */
export function isBlockedHost(host: string) {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/.test(
      h,
    )
  );
}

async function fetchImage(url: string) {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol) || isBlockedHost(u.hostname))
    throw new Error("image URL not allowed");
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!type.startsWith("image/"))
    throw new Error(`not an image (${type || "unknown type"})`);
  if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES)
    throw new Error("image too large");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("image too large");
  return { buf, type };
}

/** Uploads one image at a time (bounded memory) via uploadFilesWorkflow; reuses images already uploaded. */
export const uploadImagesStep = createStep(
  { name: "import-upload-images", maxRetries: 2, retryInterval: 3 },
  async (
    input: {
      job_id: string;
      batch_id: string;
      source: string;
      products: NormalizedProduct[];
    },
    { container },
  ) => {
    const svc: ImportModuleService = container.resolve(IMPORT_MODULE);
    const urls = [...new Set(input.products.flatMap((p) => p.images))];
    const images: Record<string, string> = {};
    const failed: Record<string, string> = {};
    if (urls.length) {
      const existing = await svc.listImportImageMaps(
        { source: input.source, url_hash: urls.map(hash) },
        { take: null as any },
      );
      for (const m of existing) images[m.source_url] = m.file_url;
    }
    for (const url of urls) {
      if (images[url]) continue;
      try {
        const { buf, type } = await fetchImage(url);
        let base = decodeURIComponent(
          new URL(url).pathname.split("/").pop() || "image",
        )
          .replace(/[^\w.\-]+/g, "_")
          .slice(-60);
        if (!/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(base))
          base += `.${EXT[type] ?? "png"}`;
        const { result } = await uploadFilesWorkflow(container).run({
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
        const f = (result as any[])[0];
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
      } catch (e: any) {
        failed[url] = String(e?.message ?? e);
      }
    }
    await svc.recordErrors(
      input.products.flatMap((p) =>
        p.images
          .filter((u) => failed[u])
          .map((u) => ({
            job_id: input.job_id,
            batch_id: input.batch_id,
            product_key: p.key,
            stage: "images",
            message: `image ${u}: ${failed[u]}`,
          })),
      ),
    );
    return new StepResponse({ images });
  },
);
