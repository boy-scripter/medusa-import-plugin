"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024, files: 1 } });
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        // /admin/* is already authenticated by Medusa; this only adds multipart parsing
        { matcher: "/admin/imports", method: ["POST"], middlewares: [upload.single("file")] },
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsbURBQTREO0FBQzVELG9EQUEyQjtBQUUzQixNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxPQUFPLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUU3RyxrQkFBZSxJQUFBLHdCQUFpQixFQUFDO0lBQy9CLE1BQU0sRUFBRTtRQUNOLGdGQUFnRjtRQUNoRixFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBUSxDQUFDLEVBQUU7S0FDN0Y7Q0FDRixDQUFDLENBQUEifQ==