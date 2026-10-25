"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("stream/promises");
const utils_1 = require("@medusajs/framework/utils");
/**
 * Thin adapter over Medusa's configured File Module (any provider: local, S3, ...).
 * Reads prefer provider streaming/buffer APIs and fall back to the file URL, because the
 * read-side API surface differs across 2.x releases.
 */
class FileStore {
    constructor(container) {
        this.file = container.resolve(utils_1.Modules.FILE);
    }
    async put(filename, content, mimeType) {
        const buf = typeof content === "string" ? Buffer.from(content, "utf8") : content;
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
    async getBuffer(id) {
        if (typeof this.file.getAsBuffer === "function")
            return Buffer.from(await this.file.getAsBuffer(id));
        if (typeof this.file.getDownloadStream === "function") {
            const chunks = [];
            for await (const c of (await this.file.getDownloadStream(id)))
                chunks.push(Buffer.from(c));
            return Buffer.concat(chunks);
        }
        let url;
        if (typeof this.file.getPresignedDownloadUrl === "function")
            url = await this.file.getPresignedDownloadUrl({ file_key: id });
        if (!url)
            url = (await this.file.retrieveFile(id)).url;
        const r = await fetch(url);
        if (!r.ok)
            throw new Error(`Could not read file ${id}: HTTP ${r.status}`);
        return Buffer.from(await r.arrayBuffer());
    }
    /** Streams to disk when the provider supports it, so large CSVs are not held in memory. */
    async downloadTo(id, dest) {
        if (typeof this.file.getDownloadStream === "function") {
            await (0, promises_1.pipeline)((await this.file.getDownloadStream(id)), fs_1.default.createWriteStream(dest));
            return;
        }
        await fs_1.default.promises.writeFile(dest, await this.getBuffer(id));
    }
    async remove(ids) {
        if (ids.length)
            await this.file.deleteFiles(ids);
    }
}
exports.FileStore = FileStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvZmlsZS1zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsOENBQTJDO0FBRTNDLHFEQUFvRDtBQUdwRDs7OztHQUlHO0FBQ0gsTUFBYSxTQUFTO0lBRXBCLFlBQVksU0FBMEI7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FDUCxRQUFnQixFQUNoQixPQUF3QixFQUN4QixRQUFnQjtRQUVoQixNQUFNLEdBQUcsR0FDUCxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDdkUsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN0QztnQkFDRSxRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO2dCQUMvQixNQUFNLEVBQUUsU0FBUzthQUNsQjtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQzVDLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQVU7UUFDeEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFVBQVU7WUFDN0MsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUN0RCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDNUIsSUFBSSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQWE7Z0JBQ3ZFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxHQUF1QixDQUFDO1FBQzVCLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixLQUFLLFVBQVU7WUFDekQsR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHO1lBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUN2RCxNQUFNLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFJLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLFVBQVUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDMUUsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELDJGQUEyRjtJQUMzRixLQUFLLENBQUMsVUFBVSxDQUFDLEVBQVUsRUFBRSxJQUFZO1FBQ3ZDLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ3RELE1BQU0sSUFBQSxtQkFBUSxFQUNaLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFhLEVBQ25ELFlBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FDM0IsQ0FBQztZQUNGLE9BQU87UUFDVCxDQUFDO1FBQ0QsTUFBTSxZQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBYTtRQUN4QixJQUFJLEdBQUcsQ0FBQyxNQUFNO1lBQUUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQ0Y7QUExREQsOEJBMERDIn0=