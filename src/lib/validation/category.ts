import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export type CategoryInput = z.infer<typeof categorySchema>;
