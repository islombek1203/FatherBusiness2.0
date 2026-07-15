import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createProduct } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const t = await getTranslations("products");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
