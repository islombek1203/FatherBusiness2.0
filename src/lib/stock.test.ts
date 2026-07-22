import { describe, expect, it } from "vitest";
import { getTotalStock } from "./stock";

describe("getTotalStock", () => {
  it("sums store and home stock", () => {
    expect(getTotalStock({ storeStock: 25, homeStock: 40 })).toBe(65);
  });

  it("handles zero stock at both locations", () => {
    expect(getTotalStock({ storeStock: 0, homeStock: 0 })).toBe(0);
  });

  it("handles stock at only one location", () => {
    expect(getTotalStock({ storeStock: 12, homeStock: 0 })).toBe(12);
    expect(getTotalStock({ storeStock: 0, homeStock: 12 })).toBe(12);
  });
});
