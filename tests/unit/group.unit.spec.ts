import { buildProduct, parseMoney, productKey, splitImages, normalizeStatus } from "../../src/modules/import/utils/group"

const R = (n: number, r: Record<string, string>) => ({ n, r })
const base = { title: "Dell Latitude 3410", brand_tag: "Dell", images: "https://e.com/a.jpg|https://e.com/a.jpg|nope", status: "Active" }

describe("buildProduct", () => {
  const rows = [
    R(2, { ...base, option_1_name: "RAM", option_2_name: "SSD", option_3_name: "Processor", variant_sku: "A", option_1_value: "8 GB", option_2_value: "256 GB", option_3_value: "Core i5", price: "27,000", dealer_price: "25000", inventory_quantity: "1", attribute_1_name: "Brand", attribute_1_value: "Dell", attribute_2_name: "Memory (RAM)", attribute_2_value: "8 GB" }),
    R(3, { title: "", variant_sku: "B", option_1_value: "16 GB", option_2_value: "256 GB", option_3_value: "Core i5", price: "31500.5", attribute_1_name: "Brand", attribute_1_value: "Dell", attribute_2_name: "Memory (RAM)", attribute_2_value: "16 GB" }),
  ]
  const { product, issues } = buildProduct(productKey(base.title, base.brand_tag), rows)

  it("combines rows and discovers dynamic options (any number)", () => {
    expect(product!.variants).toHaveLength(2)
    expect(product!.options.map((o) => o.title)).toEqual(["RAM", "SSD", "Processor"])
    expect(product!.options[0].values).toEqual(["8 GB", "16 GB"])
  })
  it("parses money, inventory, dealer price, status and de-duplicates images", () => {
    expect(product!.variants[0]).toMatchObject({ sku: "A", price: 27000, dealer_price: 25000, inventory_quantity: 1, title: "8 GB / 256 GB / Core i5" })
    expect(product!.status).toBe("published")
    expect(product!.images).toEqual(["https://e.com/a.jpg"])
    expect(issues.some((i) => /invalid image/.test(i.message))).toBe(true)
  })
  it("promotes attributes common to all variants to product level", () => {
    expect(product!.attributes).toEqual({ Brand: "Dell" })
    expect(product!.variants[1].attributes).toEqual({ "Memory (RAM)": "16 GB" })
  })
  it("rejects duplicate SKUs, duplicate combinations and missing option values", () => {
    const bad = buildProduct("k", [
      ...rows,
      R(4, { variant_sku: "A", option_1_value: "8 GB", option_2_value: "512 GB", option_3_value: "Core i5", price: "1" }),
      R(5, { variant_sku: "C", option_1_value: "8 GB", option_2_value: "256 GB", option_3_value: "Core i5", price: "1" }),
      R(6, { variant_sku: "D", option_1_value: "8 GB", option_2_value: "", option_3_value: "Core i5", price: "1" }),
      R(7, { variant_sku: "E", option_1_value: "4 GB", option_2_value: "128 GB", option_3_value: "Core i3", price: "abc" }),
    ])
    expect(bad.product!.variants.map((v) => v.sku)).toEqual(["A", "B"])
    expect(bad.issues.filter((i) => i.severity === "error")).toHaveLength(4)
  })
  it("synthesizes an option when the CSV has no option columns", () => {
    const { product: p } = buildProduct("k", [R(2, { title: "Mug", variant_sku: "M1", price: "5" })])
    expect(p!.options).toEqual([{ title: "Variant", values: ["M1"] }])
  })
  it("drops products without valid variants", () => {
    expect(buildProduct("k", [R(2, { title: "X", variant_sku: "" })]).product).toBeNull()
  })
})

describe("helpers", () => {
  it("parseMoney handles locales", () => {
    expect(parseMoney("1,234.5").value).toBe(1234.5)
    expect(parseMoney("1.234,50").value).toBe(1234.5)
    expect(parseMoney("₹27,000").value).toBe(27000)
    expect(parseMoney("-3").valid).toBe(false)
    expect(parseMoney("")).toEqual({ value: null, valid: true })
  })
  it("splitImages / normalizeStatus", () => {
    expect(splitImages("https://a/x.jpg, https://a/y.jpg;ftp://z").urls).toHaveLength(2)
    expect(normalizeStatus("Draft")).toBe("draft")
    expect(normalizeStatus("???")).toBeNull()
  })
})
