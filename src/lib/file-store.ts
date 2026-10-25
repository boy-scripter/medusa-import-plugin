import fs from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { Modules } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";

/**
 * Thin adapter over Medusa's configured File Module (any provider: local, S3, ...).
 * Reads prefer provider streaming/buffer APIs and fall back to the file URL, because the
 * read-side API surface differs across 2.x releases.
 */
export class FileStore {
  private file: any;
  constructor(container: MedusaContainer) {
    this.file = container.resolve(Modules.FILE);
  }

  async put(
    filename: string,
    content: Buffer | string,
    mimeType: string,
  ): Promise<{ id: string; url: string }> {
    const buf =
      typeof content === "string" ? Buffer.from(content, "utf8") : content;
    const res = await this.file.createFiles([
      {
        filename,
        mimeType,
        content: buf.toString("base64"),
        access: "private",
      },
    ]);
    const f = Array.isArray(res) ? res[0] : res;
    return { id: f.id, url: f.url };
  }

  async getBuffer(id: string): Promise<Buffer> {
    if (typeof this.file.getAsBuffer === "function")
      return Buffer.from(await this.file.getAsBuffer(id));
    if (typeof this.file.getDownloadStream === "function") {
      const chunks: Buffer[] = [];
      for await (const c of (await this.file.getDownloadStream(id)) as Readable)
        chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    let url: string | undefined;
    if (typeof this.file.getPresignedDownloadUrl === "function")
      url = await this.file.getPresignedDownloadUrl({ file_key: id });
    if (!url) url = (await this.file.retrieveFile(id)).url;
    const r = await fetch(url!);
    if (!r.ok) throw new Error(`Could not read file ${id}: HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }

  /** Streams to disk when the provider supports it, so large CSVs are not held in memory. */
  async downloadTo(id: string, dest: string): Promise<void> {
    if (typeof this.file.getDownloadStream === "function") {
      await pipeline(
        (await this.file.getDownloadStream(id)) as Readable,
        fs.createWriteStream(dest),
      );
      return;
    }
    await fs.promises.writeFile(dest, await this.getBuffer(id));
  }

  async remove(ids: string[]) {
    if (ids.length) await this.file.deleteFiles(ids);
  }
}
