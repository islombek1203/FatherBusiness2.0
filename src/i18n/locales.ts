import type { Locale as PrismaLocale } from "@/generated/prisma/enums";

export const locales = ["uz-Cyrl", "uz-Latn"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "uz-Cyrl";

export const localeCookieName = "NEXT_LOCALE";

export const localeLabels: Record<AppLocale, string> = {
  "uz-Cyrl": "Ўзбекча (Кирилл)",
  "uz-Latn": "O‘zbekcha (Lotin)",
};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}

// The Prisma enum can't contain a hyphen, so UZ_CYRL/UZ_LATN map 1:1 to the
// next-intl locale tags used everywhere else in the app.
const prismaToAppLocale: Record<PrismaLocale, AppLocale> = {
  UZ_CYRL: "uz-Cyrl",
  UZ_LATN: "uz-Latn",
};

const appToPrismaLocale: Record<AppLocale, PrismaLocale> = {
  "uz-Cyrl": "UZ_CYRL",
  "uz-Latn": "UZ_LATN",
};

export function toAppLocale(locale: PrismaLocale): AppLocale {
  return prismaToAppLocale[locale];
}

export function toPrismaLocale(locale: AppLocale): PrismaLocale {
  return appToPrismaLocale[locale];
}
