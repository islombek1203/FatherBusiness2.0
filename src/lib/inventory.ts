import { prisma } from "@/lib/prisma";
import type { StockLocation } from "@/generated/prisma/enums";

const STOCK_COLUMN: Record<StockLocation, "storeStock" | "homeStock"> = {
  STORE: "storeStock",
  HOME: "homeStock",
};

// Every mutation that touches stock must be transactional: the Product's
// denormalized store/home stock column and the append-only InventoryHistory
// row are written together, or not at all.
export async function adjustStock({
  productId,
  location,
  quantityAfter,
  note,
  userId,
}: {
  productId: string;
  location: StockLocation;
  quantityAfter: number;
  note?: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const column = STOCK_COLUMN[location];
    const quantityBefore = product[column];

    await tx.product.update({
      where: { id: productId },
      data: { [column]: quantityAfter },
    });

    return tx.inventoryHistory.create({
      data: {
        productId,
        type: "ADJUSTMENT",
        location,
        quantityBefore,
        quantityAfter,
        note,
        userId,
      },
    });
  });
}
