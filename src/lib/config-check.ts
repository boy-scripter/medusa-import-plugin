import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { IMPORT_MODULE } from "../modules/import/constants"
import type ImportModuleService from "../modules/import/service"

/** Validates options and that the configured Medusa records exist. Returns runtime context for batches. */
export async function validateImportConfig(container: MedusaContainer) {
  const svc: ImportModuleService = container.resolve(IMPORT_MODULE)
  const o = svc.getOptions()
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  for (const [entity, id] of [["price_list", o.price_list_id], ["sales_channel", o.sales_channel_id], ["shipping_profile", o.shipping_profile_id]] as const) {
    const { data } = await query.graph({ entity, fields: ["id"], filters: { id } })
    if (!data.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Configured ${entity} "${id}" does not exist`)
  }
  const { data: sc } = await query.graph({ entity: "sales_channel", fields: ["id", "stock_locations.id"], filters: { id: o.sales_channel_id } })
  const location_id = (sc[0] as any)?.stock_locations?.[0]?.id
  if (!location_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Sales channel "${o.sales_channel_id}" has no stock location; link one so inventory can be set`)
  }
  const store = container.resolve(Modules.STORE) as any
  const [s] = await store.listStores({}, { relations: ["supported_currencies"] })
  const cur = s?.supported_currencies?.find((c: any) => c.is_default) ?? s?.supported_currencies?.[0]
  if (!cur) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Store has no supported currency")
  return { location_id: location_id as string, currency_code: String(cur.currency_code).toLowerCase() }
}
