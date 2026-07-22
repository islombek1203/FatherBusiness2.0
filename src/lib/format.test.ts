import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format";

// Intl.NumberFormat separates the amount and the "US$" symbol with a
// non-breaking space (U+00A0), not a regular one.
const NBSP = " ";

describe("formatCurrency", () => {
  it("drops trailing decimals for whole numbers", () => {
    expect(formatCurrency(105, "UZ_LATN")).toBe(`105${NBSP}US$`);
    expect(formatCurrency(250, "UZ_LATN")).toBe(`250${NBSP}US$`);
  });

  it("keeps the fractional part when the value isn't whole", () => {
    expect(formatCurrency(105.5, "UZ_LATN")).toBe(`105,5${NBSP}US$`);
    expect(formatCurrency(105.75, "UZ_LATN")).toBe(`105,75${NBSP}US$`);
  });

  it("accepts string input (Prisma Decimal serialized via .toString())", () => {
    expect(formatCurrency("105.00", "UZ_LATN")).toBe(`105${NBSP}US$`);
    expect(formatCurrency("105.50", "UZ_LATN")).toBe(`105,5${NBSP}US$`);
  });

  it("formats zero without decimals", () => {
    expect(formatCurrency(0, "UZ_LATN")).toBe(`0${NBSP}US$`);
  });
});
