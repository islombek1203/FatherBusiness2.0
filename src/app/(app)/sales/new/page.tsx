import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createSale } from "../actions";
import { SaleForm } from "../sale-form";

export default async function NewSalePage() {
  const t = await getTranslations("sales");
  // Every active product is selectable here, even ones currently out of
  // stock at every location — `recordSale` independently re-checks the
  // selected location's stock inside the transaction and rejects the sale
  // with InsufficientStockError, so nothing is actually oversellable.
  // Filtering the list itself by stock made freshly created/seeded products
  // (zero stock until a purchase is recorded) invisible in this selector,
  // which looked like the whole dropdown was broken.
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, color: true, storeStock: true, homeStock: true, sellingPrice: true },
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
