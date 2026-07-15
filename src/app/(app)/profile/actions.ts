"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validation/user";
import type { ActionResult } from "@/lib/action-result";

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeOwnPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const currentMatches = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!currentMatches) {
    return { ok: false, error: "validation", fieldErrors: { currentPassword: ["invalid"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Force re-login everywhere, including this session — standard practice
    // after a password change.
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { ok: true };
}
