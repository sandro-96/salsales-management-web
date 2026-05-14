// src/layouts/fnb/navItems.js
import {
  Home,
  Utensils,
  Users,
  ShoppingCart,
  Table,
  UserCircle,
  Store,
  BarChart,
  ClipboardList,
  Tag,
} from "lucide-react";

export const fnbWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersFnb" },
    { to: "/products", icon: Utensils, labelKey: "nav.productsFnb" },
    { to: "/tables", icon: Table, labelKey: "nav.tables" },
    { to: "/customers", icon: UserCircle, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: ClipboardList, labelKey: "nav.inventoryFnb" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/products", icon: Utensils, labelKey: "nav.productsFnb" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersFnb" },
    { to: "/tables", icon: Table, labelKey: "nav.tables" },
    { to: "/customers", icon: UserCircle, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: ClipboardList, labelKey: "nav.inventoryFnb" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
    { to: "/staffs", icon: Users, labelKey: "nav.staff" },
  ],
  staff: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersFnb" },
    { to: "/products", icon: Utensils, labelKey: "nav.productsFnb" },
    { to: "/tables", icon: Table, labelKey: "nav.tables" },
    { to: "/customers", icon: UserCircle, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
  ],
};

export const fnbPosNav = {
  admin: [{ to: "/pos", icon: Utensils, labelKey: "nav.posOrder" }],
  manager: [{ to: "/pos", icon: Utensils, labelKey: "nav.posOrder" }],
  staff: [{ to: "/pos", icon: Utensils, labelKey: "nav.posOrder" }],
};
