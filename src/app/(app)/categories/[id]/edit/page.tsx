import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "../../actions";
import { CategoryForm } from "../../category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const t = await getTranslations("categories");
  const boundAction = updateCategory.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <CategoryForm action={boundAction} defaultValues={category} />
    </div>
  );
}
