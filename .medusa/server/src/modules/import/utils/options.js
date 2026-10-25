"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptions = validateOptions;
const utils_1 = require("@medusajs/framework/utils");
const PREFIX_RE = /^[A-Za-z0-9][A-Za-z0-9_\-\/]*$/;
/** Validates module options. Throws one error listing every problem. */
function validateOptions(o) {
    const errors = [];
    const str = (k, idPrefix) => {
        const v = o?.[k];
        if (typeof v !== "string" || !v.trim()) {
            errors.push(`"${k}" is required`);
            return "";
        }
        if (idPrefix && !v.startsWith(idPrefix))
            errors.push(`"${k}" must look like ${idPrefix}...`);
        return v.trim();
    };
    const prefix_upload = str("prefix_upload");
    if (prefix_upload && (!PREFIX_RE.test(prefix_upload) || prefix_upload.includes(".."))) {
        errors.push(`"prefix_upload" may only contain letters, digits, "_", "-" and "/" and cannot contain ".."`);
    }
    const price_list_id = str("price_list_id", "plist_");
    const sales_channel_id = str("sales_channel_id", "sc_");
    const shipping_profile_id = str("shipping_profile_id", "sp_");
    if (errors.length) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Invalid product-import module options: ${errors.join("; ")}`);
    }
    return { prefix_upload: prefix_upload.replace(/\/+$/, ""), price_list_id, sales_channel_id, shipping_profile_id };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC91dGlscy9vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBTUEsMENBbUJDO0FBekJELHFEQUF1RDtBQUd2RCxNQUFNLFNBQVMsR0FBRyxnQ0FBZ0MsQ0FBQTtBQUVsRCx3RUFBd0U7QUFDeEUsU0FBZ0IsZUFBZSxDQUFDLENBQWdDO0lBQzlELE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQTtJQUMzQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQTRCLEVBQUUsUUFBaUIsRUFBRSxFQUFFO1FBQzlELE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2hCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUFDLE9BQU8sRUFBRSxDQUFBO1FBQUMsQ0FBQztRQUN4RixJQUFJLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLFFBQVEsS0FBSyxDQUFDLENBQUE7UUFDNUYsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDakIsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0lBQzFDLElBQUksYUFBYSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RGLE1BQU0sQ0FBQyxJQUFJLENBQUMsNEZBQTRGLENBQUMsQ0FBQTtJQUMzRyxDQUFDO0lBQ0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNwRCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN2RCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUM3RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQixNQUFNLElBQUksbUJBQVcsQ0FBQyxtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsMENBQTBDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3RILENBQUM7SUFDRCxPQUFPLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxDQUFBO0FBQ25ILENBQUMifQ==