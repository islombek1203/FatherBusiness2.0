"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { expenseTypeSchema } from "@/lib/validation/expense";
import type { ActionResult } from "@/lib/action-result";

export async function createExpenseType(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = expenseTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.expenseType.findUnique({ where: { name: parsed.data.name } });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { name: ["duplicate"] } };
  }

  await prisma.expenseType.create({ data: parsed.data });
  revalidatePath("/expense-types");
  redirect("/expense-types");
}

export async function updateExpenseType(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = expenseTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.expenseType.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { name: ["duplicate"] } };
  }

  await prisma.expenseType.update({ where: { id }, data: parsed.data });
  revalidatePath("/expense-types");
  redirect("/expense-types");
}

export async function setExpenseTypeActive(id: string, isActive: boolean) {
  await requireRole(WRITE_ROLES);
  await prisma.expenseType.update({ where: { id }, data: { isActive } });
  revalidatePath("/expense-types");
}
