import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().trim().min(1, "required").max(64),
  name: z.string().trim().min(1, "required").max(200),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  unit: z.string().trim().min(1, "required").max(20),
  sellingPrice: z.coerce.number("required").min(0, "min0").max(999_999_999, "max"),
  categoryId: z.string().trim().min(1, "required"),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().trim().min(1, "required"),
  quantityAfter: z.coerce.number("required").int("integer").min(0, "min0"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
