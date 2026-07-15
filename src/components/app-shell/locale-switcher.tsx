"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeLabels } from "@/i18n/locales";
import { setLocale } from "@/lib/actions/locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" disabled={isPending} aria-label={t("language")} />}
      >
        <Languages className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((value) => (
          <DropdownMenuItem
            key={value}
            onClick={() => startTransition(() => setLocale(value))}
            className={value === locale ? "font-semibold" : undefined}
          >
            {localeLabels[value]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
