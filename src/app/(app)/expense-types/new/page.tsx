import { getTranslations } from "next-intl/server";
import { createExpenseType } from "../actions";
import { ExpenseTypeForm } from "../expense-type-form";

export default async function NewExpenseTypePage() {
  const t = await getTranslations("expenseTypes");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <ExpenseTypeForm action={createExpenseType} />
    </div>
  );
}
