"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/generated/prisma/enums";
import { logout } from "@/lib/actions/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function UserMenu({ name, role }: { name: string; role: Role }) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-auto gap-2 px-2 py-1.5" aria-label={`${name} — ${tRoles(role)}`} />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-medium">{name}</span>
          <span className="text-muted-foreground block text-xs leading-tight">{tRoles(role)}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
          <button type="submit" className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
            <LogOut className="size-4" />
            {t("logout")}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
