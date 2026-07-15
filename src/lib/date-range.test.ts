import { describe, expect, it } from "vitest";
import { getBusinessDayRange, getBusinessMonthRange } from "./date-range";

describe("getBusinessDayRange", () => {
  it("returns a 24-hour window", () => {
    const { start, end } = getBusinessDayRange(new Date("2026-03-15T10:00:00Z"));
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("resolves the Tashkent calendar day, not the UTC one", () => {
    // 20:30 UTC on March 14 is already 01:30 on March 15 in Tashkent (UTC+5).
    const { start } = getBusinessDayRange(new Date("2026-03-14T20:30:00Z"));
    expect(start.toISOString()).toBe(new Date("2026-03-14T19:00:00Z").toISOString());
  });
});

describe("getBusinessMonthRange", () => {
  it("spans from the 1st of the month to the 1st of the next", () => {
    const { start, end } = getBusinessMonthRange(new Date("2026-03-15T10:00:00Z"));
    expect(start.toISOString()).toBe(new Date("2026-02-28T19:00:00Z").toISOString());
    expect(end.toISOString()).toBe(new Date("2026-03-31T19:00:00Z").toISOString());
  });

  it("rolls over the year at December", () => {
    const { end } = getBusinessMonthRange(new Date("2026-12-15T10:00:00Z"));
    expect(end.toISOString()).toBe(new Date("2026-12-31T19:00:00Z").toISOString());
  });
});
