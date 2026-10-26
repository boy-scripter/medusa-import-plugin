export type ImportModuleOptions = {
  prefix_upload: string
  price_list_id: string
  sales_channel_id: string
  shipping_profile_id: string
  batch_size: number
  image_path_prefix: string
}

export type ImportModuleInputOptions = {
  prefix_upload: string
  price_list_id: string
  sales_channel_id: string
  shipping_profile_id: string
  batch_size?: number
  image_path_prefix?: string
}
export type ProductStatus = "draft" | "proposed" | "published" | "rejected"
export type NormalizedVariant = {
  sku: string
  title: string
  options: Record<string, string>
  price: number | null
  dealer_price: number | null
  inventory_quantity: number
  attributes: Record<string, string>
}
export type NormalizedProduct = {
  key: string
  title: string
  description: string | null
  subtitle: string | null
  category: string | null
  brand_tag: string | null
  images: string[]
  options: { title: string; values: string[] }[]
  attributes: Record<string, string>
  variants: NormalizedVariant[]
  collection_name: string | null
  status: ProductStatus
}
export type Issue = { row: number | null; product_key: string | null; severity: "error" | "warning"; message: string }
