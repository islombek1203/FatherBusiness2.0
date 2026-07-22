// Single source of truth for "how much of this product is there in total",
// so the Products page, Reports, and exports don't each re-derive
// storeStock + homeStock separately.
export function getTotalStock(product: { storeStock: number; homeStock: number }): number {
  return product.storeStock + product.homeStock;
}
