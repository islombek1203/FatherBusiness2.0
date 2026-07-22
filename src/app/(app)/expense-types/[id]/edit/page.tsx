import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { updateExpenseType } from "../../actions";
import { ExpenseTypeForm } from "../../expense-type-form";

export default async function EditExpenseTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expenseType = await prisma.expenseType.findUnique({ where: { id } });
  if (!expenseType) notFound();

  const t = await getTranslations("expenseTypes");
  const boundAction = updateExpenseType.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <ExpenseTypeForm action={boundAction} defaultValues={expenseType} />
    </div>
  );
}
