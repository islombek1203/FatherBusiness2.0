import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  History,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Truck,
  Wallet,
} from "lucide-react";
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

// Extend this list as each phase ships its routes — Users/Settings land in
// Phase 4.
export const navItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/suppliers", labelKey: "suppliers", icon: Truck },
  { href: "/purchases", labelKey: "purchases", icon: Wallet },
  { href: "/sales", labelKey: "sales", icon: ShoppingCart },
  { href: "/inventory", labelKey: "inventory", icon: History },
  { href: "/reports", labelKey: "reports", icon: BarChart3 },
];
