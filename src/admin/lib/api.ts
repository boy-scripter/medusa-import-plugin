declare const __BACKEND_URL__: string | undefined

const base = () => (typeof __BACKEND_URL__ !== "undefined" && __BACKEND_URL__ ? __BACKEND_URL__ : "")

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  const res = await fetch(`${base()}/admin/imports${path}`, {
    credentials: "include",
    ...init,
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...(init.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(body.message ?? res.statusText), { status: res.status, body })
  return body as T
}

export type Job = {
  id: string; filename: string | null; mode: "merge" | "fresh"; stage: string; status: string; interrupted: boolean
  total_rows: number; total_products: number; total_variants: number; total_batches: number; completed_batches: number
  processed_products: number; failed_products: number; last_error: string | null; created_at: string; updated_at: string
}

export const statusColor = (j: Pick<Job, "status" | "interrupted">) =>
  j.interrupted ? "orange" : ({ completed: "green", completed_with_errors: "orange", failed: "red", processing: "blue", pending: "grey", paused: "orange" } as const)[j.status as "completed"] ?? "grey"

export const statusLabel = (j: Pick<Job, "status" | "interrupted">) => (j.interrupted ? "interrupted" : j.status.replace(/_/g, " "))
