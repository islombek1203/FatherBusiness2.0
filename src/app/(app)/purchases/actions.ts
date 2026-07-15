"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { purchaseSchema } from "@/lib/validation/purchase";
import { recordPurchase } from "@/lib/purchases";
import type { ActionResult } from "@/lib/action-result";

export async function createPurchase(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(WRITE_ROLES);

  let parsedItems: unknown = [];
  try {
    const raw = formData.get("items");
    parsedItems = JSON.parse(typeof raw === "string" && raw.length > 0 ? raw : "[]");
  } catch {
    return { ok: false, error: "validation", fieldErrors: { items: ["invalid"] } };
  }

  const parsed = purchaseSchema.safeParse({
    supplierId: formData.get("supplierId"),
    note: formData.get("note"),
    items: parsedItems,
  });
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await recordPurchase({ ...parsed.data, userId: user.id });
  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");
  redirect("/purchases");
}
