import { describe, expect, it } from "vitest";
import { isAppLocale, toAppLocale, toPrismaLocale } from "./locales";

describe("locale mapping", () => {
  it("round-trips app locales through the Prisma enum", () => {
    expect(toAppLocale(toPrismaLocale("uz-Cyrl"))).toBe("uz-Cyrl");
    expect(toAppLocale(toPrismaLocale("uz-Latn"))).toBe("uz-Latn");
  });

  it("maps to the expected Prisma enum values", () => {
    expect(toPrismaLocale("uz-Cyrl")).toBe("UZ_CYRL");
    expect(toPrismaLocale("uz-Latn")).toBe("UZ_LATN");
  });

  it("validates supported locale strings", () => {
    expect(isAppLocale("uz-Cyrl")).toBe(true);
    expect(isAppLocale("uz-Latn")).toBe(true);
    expect(isAppLocale("en")).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
    expect(isAppLocale(null)).toBe(false);
  });
});
