"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { supplierSchema } from "@/lib/validation/supplier";
import type { ActionResult } from "@/lib/action-result";

export async function createSupplier(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.supplier.create({ data: parsed.data });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.supplier.update({ where: { id }, data: parsed.data });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function setSupplierActive(id: string, isActive: boolean) {
  await requireRole(WRITE_ROLES);
  await prisma.supplier.update({ where: { id }, data: { isActive } });
  revalidatePath("/suppliers");
}
