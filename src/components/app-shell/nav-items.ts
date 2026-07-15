import type { LucideIcon } from "lucide-react";
import { History, LayoutDashboard, Package, Tags, Truck } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

export type NavItem = {
  href: string;
  labelKey:
    | "dashboard"
    | "products"
    | "categories"
    | "suppliers"
    | "inventory"
    | "purchases"
    | "sales"
    | "reports"
    | "users"
    | "settings";
  icon: LucideIcon;
  // Undefined = visible to every authenticated role.
  roles?: Role[];
};

// Extend this list as each phase ships its routes — Purchases/Sales/Reports
// land in Phase 3, Users/Settings in Phase 4.
export const navItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/suppliers", labelKey: "suppliers", icon: Truck },
  { href: "/inventory", labelKey: "inventory", icon: History },
];
