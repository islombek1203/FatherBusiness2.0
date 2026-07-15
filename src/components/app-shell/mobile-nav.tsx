"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/generated/prisma/enums";
import { NavList } from "./nav-list";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label={t("actions")} />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader className="p-0">
          <SheetTitle>{t("appName")}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <NavList role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
