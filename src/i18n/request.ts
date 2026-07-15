import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { auth } from "@/auth";
import { defaultLocale, isAppLocale, localeCookieName, toAppLocale } from "./locales";

export default getRequestConfig(async () => {
  // Priority: signed-in user's saved preference (DB, via the session) > the
  // "NEXT_LOCALE" cookie (works pre-login, e.g. on /login itself) > default.
  const session = await auth();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  const locale = session?.user
    ? toAppLocale(session.user.locale)
    : isAppLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
