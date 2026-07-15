"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAppLocale, localeCookieName, toPrismaLocale } from "@/i18n/locales";

export async function setLocale(locale: string) {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });

  const session = await auth();
  if (session?.user) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: toPrismaLocale(locale) },
    });
  }

  revalidatePath("/", "layout");
}
