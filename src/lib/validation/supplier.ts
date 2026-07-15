import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "required").max(160),
  contactPerson: optionalText(160),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .email("invalid")
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
  address: optionalText(300),
  notes: optionalText(1000),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
