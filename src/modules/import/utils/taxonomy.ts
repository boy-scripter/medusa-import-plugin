import crypto from "crypto"

export type Taxonomy = {
  categories: Record<string, string> // catKey(path) -> category id
  collections: Record<string, string> // nameKey(title) -> collection id
  tags: Record<string, string> // nameKey(value) -> tag id
}

/** Case/whitespace/accent-insensitive comparison key for names. */
export const nameKey = (s: unknown) =>
  String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase()

export const splitCategoryPath = (path: string) => path.split(">").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean)
/** "Electronics > Laptops" -> "electronics>laptops" */
export const catKey = (path: string) => splitCategoryPath(path).map(nameKey).join(">")

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "item"

/** Handles are globally unique in Medusa. Try base, then scoped, then hashed. */
export function uniqueHandle(base: string, taken: Set<string>, scope?: string, seed = base) {
  const candidates = [base, ...(scope ? [`${scope}-${base}`] : []), `${base}-${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 6)}`]
  return candidates.find((c) => !taken.has(c)) ?? `${candidates[candidates.length - 1]}-${taken.size}`
}
