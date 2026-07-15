import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().trim().min(1, "required"),
  quantity: z.coerce.number("required").int("integer").positive("min0"),
  unitCost: z.coerce.number("required").min(0, "min0"),
});

export const purchaseSchema = z.object({
  supplierId: z.string().trim().min(1, "required"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  items: z.array(purchaseItemSchema).min(1, "required"),
});

export type PurchaseFormInput = z.infer<typeof purchaseSchema>;
