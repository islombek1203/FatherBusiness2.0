import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().trim().min(1, "required"),
  quantity: z.coerce.number("required").int("integer").positive("min0"),
  unitPrice: z.coerce.number("required").min(0, "min0"),
});

export const saleSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  items: z.array(saleItemSchema).min(1, "required"),
});

export type SaleFormInput = z.infer<typeof saleSchema>;
