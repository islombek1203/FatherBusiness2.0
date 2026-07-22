"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, WRITE_ROLES } from "@/lib/auth-helpers";
import { expenseSchema } from "@/lib/validation/expense";
import type { ActionResult } from "@/lib/action-result";

export async function createExpense(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole(WRITE_ROLES);

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.expense.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/expenses");
  redirect("/expenses");
}
