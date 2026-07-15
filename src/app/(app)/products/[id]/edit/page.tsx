import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const t = await getTranslations("products");
  const boundAction = updateProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <ProductForm
        action={boundAction}
        categories={categories}
        defaultValues={{
          sku: product.sku,
          name: product.name,
          description: product.description,
          unit: product.unit,
          sellingPrice: product.sellingPrice.toString(),
          categoryId: product.categoryId,
        }}
      />
    </div>
  );
}
