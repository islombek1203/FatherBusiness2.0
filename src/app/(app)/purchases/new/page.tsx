import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createPurchase } from "../actions";
import { PurchaseForm } from "../purchase-form";

export default async function NewPurchasePage() {
  const t = await getTranslations("purchases");
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, color: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <PurchaseForm action={createPurchase} suppliers={suppliers} products={products} />
    </div>
  );
}
