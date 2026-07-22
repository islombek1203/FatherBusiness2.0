import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  History,
  LayoutDashboard,
  Layers,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
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
    | "expenses"
    | "expenseTypes"
    | "reports"
    | "users"
    | "settings";
  icon: LucideIcon;
  // Undefined = visible to every authenticated role.
  roles?: Role[];
};

export const navItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/products", labelKey: "products", icon: Package },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/suppliers", labelKey: "suppliers", icon: Truck },
  { href: "/purchases", labelKey: "purchases", icon: Wallet },
  { href: "/sales", labelKey: "sales", icon: ShoppingCart },
  { href: "/expenses", labelKey: "expenses", icon: Receipt },
  { href: "/expense-types", labelKey: "expenseTypes", icon: Layers },
  { href: "/inventory", labelKey: "inventory", icon: History },
  { href: "/reports", labelKey: "reports", icon: BarChart3 },
  { href: "/users", labelKey: "users", icon: Users, roles: ["ADMIN"] },
  { href: "/settings", labelKey: "settings", icon: Settings, roles: ["ADMIN"] },
];
