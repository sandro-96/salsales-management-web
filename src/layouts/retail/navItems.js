// src/layouts/retail/navItems.js
import {
  Home,
  ShoppingCart,
  Package,
  User,
  Store,
  Users,
  BarChart,
  Settings,
  Tag,
} from "lucide-react";

export const retailWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: Package, labelKey: "nav.inventory" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: Package, labelKey: "nav.inventory" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
    { to: "/staffs", icon: Users, labelKey: "nav.staff" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
  ],
};

export const retailPosNav = {
  admin: [
    { to: "/pos", icon: ShoppingCart, labelKey: "nav.pos" },
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
  ],
  staff: [
    { to: "/pos", icon: ShoppingCart, labelKey: "nav.pos" },
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
