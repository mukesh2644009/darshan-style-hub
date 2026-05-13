import { prisma } from './prisma';

interface InventoryItem {
  productId: string;
  size: string | null;
  quantity: number;
}

/**
 * Decrements stock for each ordered item by size.
 * Returns an error string if any item is out of stock, null if all good.
 */
export async function decrementInventory(items: InventoryItem[]): Promise<string | null> {
  for (const item of items) {
    if (!item.size) continue; // no size tracking for sizeless items

    const sizeRecord = await prisma.productSize.findFirst({
      where: { productId: item.productId, size: item.size },
    });

    if (!sizeRecord) continue; // size record not set up — skip silently
    if (sizeRecord.quantity < item.quantity) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });
      return `Sorry, "${product?.name}" in size ${item.size} only has ${sizeRecord.quantity} unit(s) left.`;
    }
  }

  // All checks passed — now actually decrement
  for (const item of items) {
    if (!item.size) continue;

    await prisma.productSize.updateMany({
      where: { productId: item.productId, size: item.size },
      data: { quantity: { decrement: item.quantity } },
    });
  }

  // Auto set inStock=false for products where all sizes hit 0
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  await updateInStockStatus(productIds);

  return null;
}

/**
 * Restores stock when an order is cancelled.
 */
export async function restoreInventory(items: InventoryItem[]): Promise<void> {
  for (const item of items) {
    if (!item.size) continue;

    await prisma.productSize.updateMany({
      where: { productId: item.productId, size: item.size },
      data: { quantity: { increment: item.quantity } },
    });
  }

  // Re-enable inStock if stock was restored
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  await updateInStockStatus(productIds);
}

/**
 * Sets product.inStock based on whether any size has quantity > 0.
 * If no ProductSize records exist, leaves inStock unchanged.
 */
async function updateInStockStatus(productIds: string[]): Promise<void> {
  for (const productId of productIds) {
    const sizes = await prisma.productSize.findMany({
      where: { productId },
      select: { quantity: true },
    });

    if (sizes.length === 0) continue; // no size records — don't auto-manage inStock

    const totalStock = sizes.reduce((sum, s) => sum + s.quantity, 0);
    await prisma.product.update({
      where: { id: productId },
      data: { inStock: totalStock > 0 },
    });
  }
}
