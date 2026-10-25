import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { isStale } from "../../../lib/runner"

/** Public shape of a job: no file ids/URLs, no config IDs, no credentials. */
export function serializeJob(j: any) {
  return {
    id: j.id, filename: j.filename, mode: j.mode, stage: j.stage, status: j.status, interrupted: isStale(j),
    total_rows: j.total_rows, total_products: j.total_products, total_variants: j.total_variants,
    total_batches: j.total_batches, completed_batches: j.completed_batches,
    processed_products: j.processed_products, failed_products: j.failed_products,
    fresh_confirmed: j.fresh_confirmed, heartbeat_at: j.heartbeat_at, last_error: j.last_error,
    created_at: j.created_at, updated_at: j.updated_at,
  }
}

export async function emit(container: MedusaContainer, name: string, id: string) {
  await container.resolve(Modules.EVENT_BUS).emit({ name, data: { id } })
}
