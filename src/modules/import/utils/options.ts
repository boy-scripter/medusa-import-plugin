import { MedusaError } from "@medusajs/framework/utils"
import type { ImportModuleOptions } from "../types"

const PREFIX_RE = /^[A-Za-z0-9][A-Za-z0-9_\-\/]*$/

/** Validates module options. Throws one error listing every problem. */
export function validateOptions(o?: Partial<ImportModuleOptions>): ImportModuleOptions {
  const errors: string[] = []
  const str = (k: keyof ImportModuleOptions, idPrefix?: string) => {
    const v = o?.[k]
    if (typeof v !== "string" || !v.trim()) { errors.push(`"${k}" is required`); return "" }
    if (idPrefix && !v.startsWith(idPrefix)) errors.push(`"${k}" must look like ${idPrefix}...`)
    return v.trim()
  }
  const prefix_upload = str("prefix_upload")
  if (prefix_upload && (!PREFIX_RE.test(prefix_upload) || prefix_upload.includes(".."))) {
    errors.push(`"prefix_upload" may only contain letters, digits, "_", "-" and "/" and cannot contain ".."`)
  }
  const price_list_id = str("price_list_id", "plist_")
  const sales_channel_id = str("sales_channel_id", "sc_")
  const shipping_profile_id = str("shipping_profile_id", "sp_")
  if (errors.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid product-import module options: ${errors.join("; ")}`)
  }
  return { prefix_upload: prefix_upload.replace(/\/+$/, ""), price_list_id, sales_channel_id, shipping_profile_id }
}
