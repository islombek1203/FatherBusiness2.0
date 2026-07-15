import { prisma } from "@/lib/prisma";

// Every mutation that touches stock must be transactional: the Product's
// denormalized currentStock and the append-only InventoryHistory row are
// written together, or not at all.
export async function adjustStock({
  productId,
  quantityAfter,
  note,
  userId,
}: {
  productId: string;
  quantityAfter: number;
  note?: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const quantityBefore = product.currentStock;

    await tx.product.update({
      where: { id: productId },
      data: { currentStock: quantityAfter },
    });

    return tx.inventoryHistory.create({
      data: {
        productId,
        type: "ADJUSTMENT",
        quantityBefore,
        quantityAfter,
        note,
        userId,
      },
    });
  });
}
