import type { Prisma } from "@/generated/prisma/client";

// The single place that defines "what does this product cost". Current
// method: simple last-purchase-price — cost = the price paid on the most
// recent purchase. Swap the body of getProductCost to change the costing
// method (FIFO, weighted-average, ...) without touching any call site.
export function getProductCost(product: { lastPurchasePrice: Prisma.Decimal | number | null }): number {
  return product.lastPurchasePrice === null ? 0 : Number(product.lastPurchasePrice);
}

// Profit on a sale = sale price − cost (per getProductCost), for one unit.
export function calculateUnitProfit(unitPrice: number, unitCost: number): number {
  return unitPrice - unitCost;
}
