import { z } from "zod";

export const PRODUCT_COLORS = ["OQ", "QORA", "SARIQ"] as const;
export const STOCK_LOCATIONS = ["STORE", "HOME"] as const;

export const productSchema = z.object({
  sku: z.string().trim().min(1, "required").max(64),
  name: z.string().trim().min(1, "required").max(200),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  color: z.enum(PRODUCT_COLORS, "required"),
  sellingPrice: z.coerce.number("required").min(0, "min0").max(999_999_999, "max"),
  categoryId: z.string().trim().min(1, "required"),
});

export type ProductInput = z.infer<typeof productSchema>;

// Product creation only — a new product otherwise starts at 0 stock with no
// way to record how many you already have on hand without a separate
// purchase or stock-adjustment step. Blank/omitted defaults to 0 via coerce,
// same as never having touched the field.
export const productCreateSchema = productSchema.extend({
  initialStock: z.coerce.number("required").int("integer").min(0, "min0"),
  // Defaults to STORE so a blank/omitted selection (e.g. initialStock left
  // at 0, where the location picker is moot) never fails validation.
  initialStockLocation: z.enum(STOCK_LOCATIONS).default("STORE"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().trim().min(1, "required"),
  location: z.enum(STOCK_LOCATIONS, "required"),
  quantityAfter: z.coerce.number("required").int("integer").min(0, "min0"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
