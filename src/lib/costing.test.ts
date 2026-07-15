import { describe, expect, it } from "vitest";
import { calculateUnitProfit, getProductCost } from "./costing";

describe("getProductCost", () => {
  it("returns 0 for a product that has never been purchased", () => {
    expect(getProductCost({ lastPurchasePrice: null })).toBe(0);
  });

  it("returns the last purchase price as a number", () => {
    expect(getProductCost({ lastPurchasePrice: 1500 })).toBe(1500);
  });

  it("handles Decimal-like objects via Number() coercion", () => {
    // Prisma.Decimal instances stringify/valueOf to their numeric value.
    const decimalLike = { toString: () => "2500.50", valueOf: () => "2500.50" };
    expect(getProductCost({ lastPurchasePrice: decimalLike as unknown as number })).toBe(2500.5);
  });
});

describe("calculateUnitProfit", () => {
  it("computes sale price minus cost", () => {
    expect(calculateUnitProfit(5000, 3000)).toBe(2000);
  });

  it("can be negative when sold below cost", () => {
    expect(calculateUnitProfit(1000, 1500)).toBe(-500);
  });

  it("is zero when sold at cost", () => {
    expect(calculateUnitProfit(2000, 2000)).toBe(0);
  });
});
