"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.catKey = exports.splitCategoryPath = exports.nameKey = void 0;
exports.uniqueHandle = uniqueHandle;
const crypto_1 = __importDefault(require("crypto"));
/** Case/whitespace/accent-insensitive comparison key for names. */
const nameKey = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
exports.nameKey = nameKey;
const splitCategoryPath = (path) => path.split(">").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
exports.splitCategoryPath = splitCategoryPath;
/** "Electronics > Laptops" -> "electronics>laptops" */
const catKey = (path) => (0, exports.splitCategoryPath)(path).map(exports.nameKey).join(">");
exports.catKey = catKey;
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "item";
exports.slugify = slugify;
/** Handles are globally unique in Medusa. Try base, then scoped, then hashed. */
function uniqueHandle(base, taken, scope, seed = base) {
    const candidates = [base, ...(scope ? [`${scope}-${base}`] : []), `${base}-${crypto_1.default.createHash("sha1").update(seed).digest("hex").slice(0, 6)}`];
    return candidates.find((c) => !taken.has(c)) ?? `${candidates[candidates.length - 1]}-${taken.size}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGF4b25vbXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9pbXBvcnQvdXRpbHMvdGF4b25vbXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBb0JBLG9DQUdDO0FBdkJELG9EQUEyQjtBQVEzQixtRUFBbUU7QUFDNUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFVLEVBQUUsRUFBRSxDQUNwQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRGhFLFFBQUEsT0FBTyxXQUN5RDtBQUV0RSxNQUFNLGlCQUFpQixHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7QUFBL0csUUFBQSxpQkFBaUIscUJBQThGO0FBQzVILHVEQUF1RDtBQUNoRCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBQSx5QkFBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsZUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQXpFLFFBQUEsTUFBTSxVQUFtRTtBQUUvRSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQ25DLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksTUFBTSxDQUFBO0FBRHpKLFFBQUEsT0FBTyxXQUNrSjtBQUV0SyxpRkFBaUY7QUFDakYsU0FBZ0IsWUFBWSxDQUFDLElBQVksRUFBRSxLQUFrQixFQUFFLEtBQWMsRUFBRSxJQUFJLEdBQUcsSUFBSTtJQUN4RixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxJQUFJLGdCQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDaEosT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN0RyxDQUFDIn0=