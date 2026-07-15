import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "STAFF", "VIEWER"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "required").max(160),
  email: z.string().trim().toLowerCase().email("invalid"),
  password: z.string().min(8, "min8"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "required").max(160),
  role: roleEnum,
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "min8"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "required").max(160),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    newPassword: z.string().min(8, "min8"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordMismatch",
  });
