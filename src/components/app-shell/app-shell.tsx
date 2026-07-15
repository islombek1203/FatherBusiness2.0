import { getTranslations } from "next-intl/server";
import type { Role } from "@/generated/prisma/enums";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { NavList } from "./nav-list";
import { UserMenu } from "./user-menu";

export async function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-dvh">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r p-4 md:flex">
        <span className="px-3 py-2 text-lg font-semibold">{t("appName")}</span>
        <div className="mt-4">
          <NavList role={user.role} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <MobileNav role={user.role} />
          <span className="text-base font-semibold md:hidden">{t("appName")}</span>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher />
            <UserMenu name={user.name} role={user.role} />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
