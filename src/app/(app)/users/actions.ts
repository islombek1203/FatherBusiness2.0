"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "@/lib/validation/user";
import type { ActionResult } from "@/lib/action-result";

const ADMIN_ONLY = ["ADMIN"] as const;

// Prevents the last active Admin from being demoted or deactivated, which
// would lock every user out of user/settings management permanently.
async function assertNotLastActiveAdmin(userId: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.role !== "ADMIN" || !target.isActive) return;

  const otherActiveAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true, NOT: { id: userId } },
  });
  if (otherActiveAdmins === 0) {
    throw new Error("lastAdmin");
  }
}

export async function createUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole([...ADMIN_ONLY]);

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { email: ["duplicate"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole([...ADMIN_ONLY]);

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.role !== "ADMIN") {
    try {
      await assertNotLastActiveAdmin(id);
    } catch {
      return { ok: false, error: "lastAdmin" };
    }
  }

  await prisma.user.update({ where: { id }, data: parsed.data });
  revalidatePath("/users");
  redirect("/users");
}

export async function setUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireRole([...ADMIN_ONLY]);

  if (!isActive) {
    try {
      await assertNotLastActiveAdmin(id);
    } catch {
      return { ok: false, error: "lastAdmin" };
    }
    // Deactivating a user must also kill their active sessions immediately.
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
  return { ok: true };
}

export async function resetUserPassword(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireRole([...ADMIN_ONLY]);

  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash } }),
    // Force re-login everywhere the user is currently signed in.
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);

  revalidatePath("/users");
  return { ok: true };
}
