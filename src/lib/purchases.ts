import { prisma } from "@/lib/prisma";

export type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

// A purchase either fully applies — stock, InventoryHistory, and
// Product.lastPurchasePrice for every line — or not at all.
export async function recordPurchase({
  supplierId,
  items,
  note,
  userId,
}: {
  supplierId: string;
  items: PurchaseItemInput[];
  note?: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const purchase = await tx.purchase.create({
      data: { supplierId, note, userId, totalAmount },
    });

    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const quantityBefore = product.currentStock;
      const quantityAfter = quantityBefore + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: quantityAfter, lastPurchasePrice: item.unitCost },
      });

      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        },
      });

      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          type: "PURCHASE",
          quantityBefore,
          quantityAfter,
          userId,
          note: note ? `Purchase: ${note}` : "Purchase",
        },
      });
    }

    return purchase;
  });
}
