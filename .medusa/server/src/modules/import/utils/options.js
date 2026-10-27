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
    // Optional fields with defaults
    const batch_size = o?.batch_size ?? 10;
    if (typeof batch_size !== "number" || batch_size < 1 || batch_size > 100) {
        errors.push(`"batch_size" must be a number between 1 and 100`);
    }
    const image_path_prefix = o?.image_path_prefix ?? "imports";
    if (typeof image_path_prefix !== "string" || !image_path_prefix.trim()) {
        errors.push(`"image_path_prefix" must be a non-empty string`);
    }
    else if (!PREFIX_RE.test(image_path_prefix) || image_path_prefix.includes("..")) {
        errors.push(`"image_path_prefix" may only contain letters, digits, "_", "-" and "/" and cannot contain ".."`);
    }
    if (errors.length) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Invalid product-import module options: ${errors.join("; ")}`);
    }
    return {
        prefix_upload: prefix_upload.replace(/\/+$/, ""),
        price_list_id,
        sales_channel_id,
        shipping_profile_id,
        batch_size,
        image_path_prefix: image_path_prefix.replace(/\/+$/, "")
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2ltcG9ydC91dGlscy9vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBTUEsMENBd0NDO0FBOUNELHFEQUF1RDtBQUd2RCxNQUFNLFNBQVMsR0FBRyxnQ0FBZ0MsQ0FBQTtBQUVsRCx3RUFBd0U7QUFDeEUsU0FBZ0IsZUFBZSxDQUFDLENBQWdDO0lBQzlELE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQTtJQUMzQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQTRCLEVBQUUsUUFBaUIsRUFBRSxFQUFFO1FBQzlELE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2hCLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUFDLE9BQU8sRUFBRSxDQUFBO1FBQUMsQ0FBQztRQUN4RixJQUFJLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLFFBQVEsS0FBSyxDQUFDLENBQUE7UUFDNUYsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDakIsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0lBQzFDLElBQUksYUFBYSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RGLE1BQU0sQ0FBQyxJQUFJLENBQUMsNEZBQTRGLENBQUMsQ0FBQTtJQUMzRyxDQUFDO0lBQ0QsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNwRCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN2RCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUU3RCxnQ0FBZ0M7SUFDaEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUE7SUFDdEMsSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDekUsTUFBTSxDQUFDLElBQUksQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO0lBQ2hFLENBQUM7SUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsRUFBRSxpQkFBaUIsSUFBSSxTQUFTLENBQUE7SUFDM0QsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7UUFDdkUsTUFBTSxDQUFDLElBQUksQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO0lBQy9ELENBQUM7U0FBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xGLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0dBQWdHLENBQUMsQ0FBQTtJQUMvRyxDQUFDO0lBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsTUFBTSxJQUFJLG1CQUFXLENBQUMsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLDBDQUEwQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN0SCxDQUFDO0lBQ0QsT0FBTztRQUNMLGFBQWEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFDaEQsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixtQkFBbUI7UUFDbkIsVUFBVTtRQUNWLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO0tBQ3pELENBQUE7QUFDSCxDQUFDIn0=