import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024, files: 1 } })

export default defineMiddlewares({
  routes: [
    // /admin/* is already authenticated by Medusa; this only adds multipart parsing
    { matcher: "/admin/imports", method: ["POST"], middlewares: [upload.single("file") as any] },
  ],
})
