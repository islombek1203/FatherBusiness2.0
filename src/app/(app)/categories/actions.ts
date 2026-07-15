"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { categorySchema } from "@/lib/validation/category";
import type { ActionResult } from "@/lib/action-result";

export async function createCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.category.findUnique({ where: { name: parsed.data.name } });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { name: ["duplicate"] } };
  }

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.category.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { name: ["duplicate"] } };
  }

  await prisma.category.update({ where: { id }, data: parsed.data });
  revalidatePath("/categories");
  redirect("/categories");
}

export async function setCategoryActive(id: string, isActive: boolean) {
  await requireRole(WRITE_ROLES);
  await prisma.category.update({ where: { id }, data: { isActive } });
  revalidatePath("/categories");
}
