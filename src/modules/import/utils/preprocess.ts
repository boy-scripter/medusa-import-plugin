import fs from "fs"
import path from "path"
import readline from "readline"
import { once } from "events"
import { parse } from "csv-parse"
import { buildProduct, bucketOf, productKey, type RawRow } from "./group"
import type { Issue, NormalizedProduct } from "../types"
import { PART_SIZE } from "../constants"

export type PreprocessResult = { total_rows: number; total_products: number; total_variants: number; skipped_rows: number }
const REQUIRED = ["title", "variant_sku"]

/**
 * Two-pass, bounded-memory preprocessing.
 *  1. Stream CSV; forward-fill blank titles; hash product key into N bucket files on disk.
 *  2. Per bucket: group, stable-sort by product key, build products, emit in parts of PART_SIZE.
 * Output order is deterministic (bucket, then product key).
 */
export async function preprocessCsv(opts: {
  csvPath: string
  workDir: string
  buckets?: number
  partSize?: number
  onPart: (part: { index: number; products: NormalizedProduct[] }) => Promise<void>
  onIssues: (issues: Issue[]) => Promise<void>
  /** called periodically so the job heartbeat stays fresh on long files */
  onTick?: () => Promise<void>
}): Promise<PreprocessResult> {
  const N = opts.buckets ?? 64
  const partSize = opts.partSize ?? PART_SIZE
  const dir = path.join(opts.workDir, "buckets")
  await fs.promises.mkdir(dir, { recursive: true })
  const streams = new Map<number, fs.WriteStream>()
  const write = async (b: number, line: string) => {
    let s = streams.get(b)
    if (!s) { s = fs.createWriteStream(path.join(dir, `b${b}.ndjson`)); streams.set(b, s) }
    if (!s.write(line)) await once(s, "drain")
  }

  let rows = 0, skipped = 0, prevKey: string | null = null
  let pending: Issue[] = []
  const flushIssues = async (force = false) => {
    if (pending.length && (force || pending.length >= 200)) { const p = pending; pending = []; await opts.onIssues(p) }
  }

  const parser = fs.createReadStream(opts.csvPath).pipe(
    parse({
      columns: (h: string[]) => {
        const cols = h.map((x) => x.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_"))
        const missing = REQUIRED.filter((c) => !cols.includes(c))
        if (missing.length) throw new Error(`CSV is missing required column(s): ${missing.join(", ")}`)
        return cols
      },
      bom: true, skip_empty_lines: true, trim: true, relax_column_count: true, relax_quotes: true,
    })
  )
  for await (const rec of parser as AsyncIterable<Record<string, string>>) {
    rows++
    const n = rows + 1 // line number incl. header
    const title = (rec.title ?? "").trim()
    let key: string
    if (title) key = productKey(title, rec.brand_tag)
    else if (prevKey) key = prevKey
    else { skipped++; pending.push({ row: n, product_key: null, severity: "error", message: "row has no title and no previous product" }); continue }
    prevKey = key
    if (!title) rec.title = "" // title resolved at group time from the product's first row
    await write(bucketOf(key, N), JSON.stringify({ key, n, r: rec }) + "\n")
    await flushIssues()
    if (rows % 2000 === 0) await opts.onTick?.()
  }
  await Promise.all([...streams.values()].map((s) => new Promise<void>((res) => s.end(res))))
  await flushIssues(true)
  if (rows === 0) throw new Error("CSV contains no data rows")

  // pass 2
  let part: NormalizedProduct[] = [], partIndex = 0, products = 0, variants = 0
  const emit = async (force: boolean) => {
    if (part.length && (force || part.length >= partSize)) {
      const p = part; part = []
      await opts.onPart({ index: partIndex++, products: p })
    }
  }
  for (let b = 0; b < N; b++) {
    const file = path.join(dir, `b${b}.ndjson`)
    if (!fs.existsSync(file)) continue
    const groups = new Map<string, RawRow[]>()
    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })
    for await (const line of rl) {
      if (!line) continue
      const { key, n, r } = JSON.parse(line)
      const g = groups.get(key) ?? []
      g.push({ n, r }); groups.set(key, g)
    }
    for (const key of [...groups.keys()].sort()) {
      const { product, issues } = buildProduct(key, groups.get(key)!)
      pending.push(...issues)
      if (product) { part.push(product); products++; variants += product.variants.length }
      await flushIssues(); await emit(false)
      if (products % 200 === 0) await opts.onTick?.()
    }
    await fs.promises.rm(file, { force: true })
  }
  await emit(true)
  await flushIssues(true)
  return { total_rows: rows, total_products: products, total_variants: variants, skipped_rows: skipped }
}
