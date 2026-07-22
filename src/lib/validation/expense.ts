import { z } from "zod";

export const expenseTypeSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type ExpenseTypeInput = z.infer<typeof expenseTypeSchema>;

export const expenseSchema = z.object({
  expenseTypeId: z.string().trim().min(1, "required"),
  amount: z.coerce.number("required").min(0, "min0").max(999_999_999, "max"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
