import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createSale } from "../actions";
import { SaleForm } from "../sale-form";

export default async function NewSalePage() {
  const t = await getTranslations("sales");
  const products = await prisma.product.findMany({
    where: { isActive: true, currentStock: { gt: 0 } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, unit: true, currentStock: true, sellingPrice: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <SaleForm
        action={createSale}
        products={products.map((p) => ({ ...p, sellingPrice: p.sellingPrice.toString() }))}
      />
    </div>
  );
}
