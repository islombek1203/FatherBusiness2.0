import type { LucideIcon } from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  labelKey: "dashboard" | "products" | "categories" | "suppliers" | "purchases" | "sales" | "reports" | "users" | "settings";
  icon: LucideIcon;
  // Undefined = visible to every authenticated role.
  roles?: Role[];
};

// Extend this list as each phase ships its routes — Products/Suppliers/etc.
// land in Phase 2, Purchases/Sales/Reports in Phase 3, Users/Settings in Phase 4.
export const navItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
];
