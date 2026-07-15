"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { saleSchema } from "@/lib/validation/sale";
import { recordSale, InsufficientStockError } from "@/lib/sales";
import type { ActionResult } from "@/lib/action-result";

export async function createSale(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(WRITE_ROLES);

  let parsedItems: unknown = [];
  try {
    const raw = formData.get("items");
    parsedItems = JSON.parse(typeof raw === "string" && raw.length > 0 ? raw : "[]");
  } catch {
    return { ok: false, error: "validation", fieldErrors: { items: ["invalid"] } };
  }

  const parsed = saleSchema.safeParse({
    note: formData.get("note"),
    items: parsedItems,
  });
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await recordSale({ ...parsed.data, userId: user.id });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { ok: false, error: "insufficientStock" };
    }
    throw error;
  }

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");
  redirect("/sales");
}
