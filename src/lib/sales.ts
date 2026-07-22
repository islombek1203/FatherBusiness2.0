import { prisma } from "@/lib/prisma";
import { calculateUnitProfit, getProductCost } from "@/lib/costing";
import type { StockLocation } from "@/generated/prisma/enums";

const STOCK_COLUMN: Record<StockLocation, "storeStock" | "homeStock"> = {
  STORE: "storeStock",
  HOME: "homeStock",
};

export class InsufficientStockError extends Error {
  constructor(
    public productId: string,
    public location: StockLocation,
    public available: number,
    public requested: number
  ) {
    super(
      `Insufficient stock for product ${productId} at ${location}: available ${available}, requested ${requested}`
    );
    this.name = "InsufficientStockError";
  }
}

export type SaleItemInput = {
  productId: string;
  location: StockLocation;
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
      const column = STOCK_COLUMN[item.location];
      const available = product[column];
      // Checked per location — a color/location with plenty of stock
      // elsewhere never covers a shortfall at the location actually sold
      // from.
      if (available < item.quantity) {
        throw new InsufficientStockError(item.productId, item.location, available, item.quantity);
      }

      const quantityBefore = available;
      const quantityAfter = quantityBefore - item.quantity;
      const unitCost = getProductCost(product);
      const lineAmount = item.quantity * item.unitPrice;
      const lineProfit = item.quantity * calculateUnitProfit(item.unitPrice, unitCost);
      totalAmount += lineAmount;
      totalProfit += lineProfit;

      await tx.product.update({
        where: { id: item.productId },
        data: { [column]: quantityAfter },
      });

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          location: item.location,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost,
        },
      });

      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          type: "SALE",
          location: item.location,
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
