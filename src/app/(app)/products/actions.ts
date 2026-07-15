"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { productSchema, stockAdjustmentSchema } from "@/lib/validation/product";
import { adjustStock } from "@/lib/inventory";
import type { ActionResult } from "@/lib/action-result";

export async function createProduct(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { sku: ["duplicate"] } };
  }

  await prisma.product.create({ data: parsed.data });
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireRole(WRITE_ROLES);

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const duplicate = await prisma.product.findFirst({
    where: { sku: parsed.data.sku, NOT: { id } },
  });
  if (duplicate) {
    return { ok: false, error: "validation", fieldErrors: { sku: ["duplicate"] } };
  }

  await prisma.product.update({ where: { id }, data: parsed.data });
  revalidatePath("/products");
  redirect("/products");
}

export async function setProductActive(id: string, isActive: boolean) {
  await requireRole(WRITE_ROLES);
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/products");
}

export async function adjustProductStock(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(WRITE_ROLES);

  const parsed = stockAdjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await adjustStock({ ...parsed.data, userId: user.id });
  revalidatePath("/products");
  revalidatePath("/inventory");
  return { ok: true };
}
