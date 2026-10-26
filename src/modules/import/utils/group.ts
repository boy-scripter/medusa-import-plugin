import crypto from "crypto"
import type { Issue, NormalizedProduct, NormalizedVariant, ProductStatus } from "../types"

export type RawRow = { n: number; r: Record<string, string> }

const clean = (v: unknown) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim())
export const norm = (v: unknown) => clean(v).toLowerCase()

/** Grouping strategy: normalized title + "|" + normalized brand_tag. Rows with a blank title inherit the previous row's key. */
export const productKey = (title: unknown, brand: unknown) => `${norm(title)}|${norm(brand)}`
export const bucketOf = (key: string, buckets: number) =>
  crypto.createHash("md5").update(key).digest().readUInt32BE(0) % buckets

export function parseMoney(raw?: string): { value: number | null; valid: boolean } {
  const s = clean(raw).replace(/[^\d.,-]/g, "")
  if (!s) return { value: null, valid: true }
  let t = s
  if (t.includes(",") && t.includes(".")) {
    // the last separator is the decimal mark
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "")
  } else if (t.includes(",")) t = /,\d{3}(,|$)/.test(t) && !/,\d{1,2}$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".")
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? { value: n, valid: true } : { value: null, valid: false }
}

export function splitImages(raw?: string): { urls: string[]; invalid: string[] } {
  const parts = String(raw ?? "").split(/[|\n;,]+/).map((x) => x.trim()).filter(Boolean)
  const urls: string[] = [], invalid: string[] = []
  for (const p of parts) {
    if (/^https?:\/\/\S+$/i.test(p)) { if (!urls.includes(p)) urls.push(p) } else invalid.push(p)
  }
  return { urls, invalid }
}

export function normalizeStatus(raw: string | null): ProductStatus | null {
  const s = norm(raw)
  if (!s) return null
  if (["published", "publish", "active", "live", "1", "true", "yes"].includes(s)) return "published"
  if (["draft", "inactive", "0", "false", "no"].includes(s)) return "draft"
  if (["proposed", "rejected"].includes(s)) return s as ProductStatus
  return null
}

const indexed = (r: Record<string, string>, re: RegExp) =>
  Object.keys(r).map((k) => ({ k, m: re.exec(k) })).filter((x) => x.m).map((x) => ({ k: x.k, i: Number(x.m![1]) }))

/** Combine all rows of one product into the normalized structure. Options/attributes are discovered dynamically. */
export function buildProduct(key: string, rows: RawRow[]): { product: NormalizedProduct | null; issues: Issue[] } {
  const issues: Issue[] = []
  const err = (row: number | null, message: string) => issues.push({ row, product_key: key, severity: "error", message })
  const warn = (row: number | null, message: string) => issues.push({ row, product_key: key, severity: "warning", message })
  const sorted = [...rows].sort((a, b) => a.n - b.n)
  const first = (f: string) => { for (const { r } of sorted) { const v = clean(r[f]); if (v) return v } return null }

  const title = first("title")
  if (!title) { err(sorted[0]?.n ?? null, "missing title"); return { product: null, issues } }
  let description: string | null = null
  for (const { r } of sorted) { const v = String(r.description ?? "").trim(); if (v) { description = v; break } }

  // images (union across rows)
  const images: string[] = []
  for (const { n, r } of sorted) {
    const { urls, invalid } = splitImages(r.images)
    urls.forEach((u) => !images.includes(u) && images.push(u))
    if (invalid.length) warn(n, `ignored ${invalid.length} invalid image URL(s)`)
  }

  // dynamic option slots: option_<i>_name, deduplicated case-insensitively
  const slotNames = new Map<number, string>()
  for (const { n, r } of sorted) {
    for (const { k, i } of indexed(r, /^option_(\d+)_name$/)) {
      const v = clean(r[k])
      if (!v) continue
      const cur = slotNames.get(i)
      if (!cur) slotNames.set(i, v)
      else if (norm(cur) !== norm(v)) warn(n, `option_${i}_name "${v}" differs from "${cur}"; using "${cur}"`)
    }
  }
  const slots: { i: number; title: string }[] = []
  for (const [i, t] of [...slotNames.entries()].sort((a, b) => a[0] - b[0])) {
    if (slots.some((s) => norm(s.title) === norm(t))) warn(null, `duplicate option name "${t}" (option_${i}) ignored`)
    else slots.push({ i, title: t })
  }
  const synthetic = slots.length === 0 // no option columns: synthesize a single "Variant" option keyed by SKU

  const optionValues = new Map<string, string[]>()
  const variants: NormalizedVariant[] = []
  const seenSku = new Set<string>(), seenCombo = new Set<string>()

  for (const { n, r } of sorted) {
    const sku = clean(r.variant_sku)
    if (!sku) { err(n, "missing variant_sku"); continue }
    if (seenSku.has(sku.toLowerCase())) { err(n, `duplicate SKU "${sku}" within product`); continue }

    const opts: Record<string, string> = {}
    let bad = false
    if (synthetic) opts["Variant"] = sku
    else for (const s of slots) {
      const v = clean(r[`option_${s.i}_value`])
      if (!v) { err(n, `missing value for option "${s.title}"`); bad = true; break }
      opts[s.title] = v
    }
    if (bad) continue
    const combo = Object.values(opts).map(norm).join("|")
    if (seenCombo.has(combo)) { err(n, `duplicate option combination "${Object.values(opts).join(" / ")}"`); continue }

    const price = parseMoney(r.price)
    if (!price.valid) { err(n, `invalid price "${r.price}"`); continue }
    if (price.value === null) warn(n, `no price for SKU "${sku}"`)
    const dealer = parseMoney(r.dealer_price)
    if (!dealer.valid) warn(n, `invalid dealer_price "${r.dealer_price}" ignored`)
    let inv = 0
    if (clean(r.inventory_quantity)) {
      const q = Number(clean(r.inventory_quantity).replace(/,/g, ""))
      if (Number.isInteger(q) && q >= 0) inv = q
      else warn(n, `invalid inventory_quantity "${r.inventory_quantity}" set to 0`)
    }

    const attributes: Record<string, string> = {}
    for (const { k, i } of indexed(r, /^attribute_(\d+)_name$/)) {
      const name = clean(r[k]), val = clean(r[`attribute_${i}_value`])
      if (name && val) attributes[name] = val
    }
    for (const { k, i } of indexed(r, /^attribute_(\d+)_value$/)) {
      if (clean(r[k]) && !clean(r[`attribute_${i}_name`])) warn(n, `attribute_${i}_value has no name`)
    }

    seenSku.add(sku.toLowerCase()); seenCombo.add(combo)
    for (const [t, v] of Object.entries(opts)) {
      const list = optionValues.get(t) ?? []
      if (!list.includes(v)) list.push(v)
      optionValues.set(t, list)
    }
    variants.push({
      sku, title: clean(r.variant_title) || Object.values(opts).join(" / "), options: opts,
      price: price.value, dealer_price: dealer.valid ? dealer.value : null, inventory_quantity: inv, attributes,
    })
  }
  if (!variants.length) { err(null, "no valid variants"); return { product: null, issues } }

  // Use all attributes from first variant as product attributes
  const attributes: Record<string, string> = { ...variants[0].attributes }
  // Clear all variant attributes
  for (const v of variants) {
    v.attributes = {}
  }

  const rawStatus = first("status")
  const status = normalizeStatus(rawStatus)
  if (rawStatus && !status) warn(null, `unknown status "${rawStatus}", using draft`)

  return {
    issues,
    product: {
      key, title, description, subtitle: first("subtitle"), category: first("category"), brand_tag: first("brand_tag"),
      images, options: [...optionValues.entries()].map(([t, values]) => ({ title: t, values })),
      attributes, variants, collection_name: first("collection_name"), status: status ?? "draft",
    },
  }
}
