import type { Locale } from "@/generated/prisma/enums";

// The app has a single unit of measure application-wide ("dona"), used as
// literal display text regardless of locale — not a translated string, the
// same way a currency symbol isn't. Append it to a bare quantity number
// wherever one is shown; never store or accept it as per-product data.
export const UNIT_LABEL = "dona";

const INTL_LOCALE: Record<Locale, string> = {
  UZ_LATN: "uz-Latn",
  UZ_CYRL: "uz-Cyrl",
};

// All money columns are `Decimal(14, 2)` (see prisma/schema.prisma), so two
// fraction digits is always enough to represent them exactly — this just
// controls how many of those digits actually render: none for a whole
// number, otherwise as many as the value has (up to 2), never padded with
// trailing zeros.
export function formatCurrency(value: number | string, locale: Locale): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
