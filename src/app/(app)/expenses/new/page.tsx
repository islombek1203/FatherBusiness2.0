import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createExpense } from "../actions";
import { ExpenseForm } from "../expense-form";

export default async function NewExpensePage() {
  const t = await getTranslations("expenses");
  const expenseTypes = await prisma.expenseType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <ExpenseForm action={createExpense} expenseTypes={expenseTypes} />
    </div>
  );
}
