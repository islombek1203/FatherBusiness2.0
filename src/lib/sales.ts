import { prisma } from "@/lib/prisma";
import { calculateUnitProfit, getProductCost } from "@/lib/costing";

export class InsufficientStockError extends Error {
  constructor(public productId: string, public available: number, public requested: number) {
    super(`Insufficient stock for product ${productId}: available ${available}, requested ${requested}`);
    this.name = "InsufficientStockError";
  }
}

export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

// A sale either fully applies — stock, InventoryHistory, and the profit
// snapshot for every line — or not at all. Throwing anywhere inside the
// $transaction callback rolls the whole thing back, so a mid-sale stock
// shortfall never leaves partial stock/history changes behind.
export async function recordSale({
  items,
  note,
  userId,
}: {
  items: SaleItemInput[];
  note?: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: { userId, note, totalAmount: 0, totalProfit: 0 },
    });

    let totalAmount = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      if (product.currentStock < item.quantity) {
        throw new InsufficientStockError(item.productId, product.currentStock, item.quantity);
      }

      const quantityBefore = product.currentStock;
      const quantityAfter = quantityBefore - item.quantity;
      const unitCost = getProductCost(product);
      const lineAmount = item.quantity * item.unitPrice;
      const lineProfit = item.quantity * calculateUnitProfit(item.unitPrice, unitCost);
      totalAmount += lineAmount;
      totalProfit += lineProfit;

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: quantityAfter },
      });

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost,
        },
      });

      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantityBefore,
          quantityAfter,
          userId,
          note: note ? `Sale: ${note}` : "Sale",
        },
      });
    }

    return tx.sale.update({ where: { id: sale.id }, data: { totalAmount, totalProfit } });
  });
}
