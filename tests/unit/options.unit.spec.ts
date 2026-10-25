import { validateOptions } from "../../src/modules/import/utils/options"
import { isBlockedHost } from "../../src/workflows/steps/upload-images"

const ok = { prefix_upload: "product-sheet/", price_list_id: "plist_1", sales_channel_id: "sc_1", shipping_profile_id: "sp_1" }

describe("validateOptions", () => {
  it("accepts valid options and normalizes the prefix", () => expect(validateOptions(ok).prefix_upload).toBe("product-sheet"))
  it("lists every problem at once", () => {
    expect(() => validateOptions({ prefix_upload: "../x", price_list_id: "bad" })).toThrow(/prefix_upload.*price_list_id.*sales_channel_id.*shipping_profile_id/s)
  })
  it("rejects undefined options", () => expect(() => validateOptions(undefined)).toThrow(/required/))
})
describe("isBlockedHost", () => {
  it.each(["localhost", "127.0.0.1", "10.1.2.3", "192.168.0.5", "169.254.169.254", "172.20.1.1"])("blocks %s", (h) => expect(isBlockedHost(h)).toBe(true))
  it("allows public hosts", () => expect(isBlockedHost("cdn.example.com")).toBe(false))
})
