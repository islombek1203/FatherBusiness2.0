import { getTranslations } from "next-intl/server";
import { createCategory } from "../actions";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  const t = await getTranslations("categories");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <CategoryForm action={createCategory} />
    </div>
  );
}
