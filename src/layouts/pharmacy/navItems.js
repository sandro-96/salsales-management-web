// src/layouts/pharmacy/navItems.js
import {
  Home,
  Pill,
  User,
  Store,
  Users,
  BarChart,
  ShoppingCart,
  Settings,
  Tag,
} from "lucide-react";

export const pharmacyWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersPharmacy" },
    { to: "/products", icon: Pill, labelKey: "nav.productsPharmacy" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: Pill, labelKey: "nav.inventoryPharmacy" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/products", icon: Pill, labelKey: "nav.productsPharmacy" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersPharmacy" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
    { to: "/branches", icon: Store, labelKey: "nav.branches" },
    { to: "/inventory", icon: Pill, labelKey: "nav.inventoryPharmacy" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
    { to: "/staffs", icon: Users, labelKey: "nav.staff" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersPharmacy" },
    { to: "/products", icon: Pill, labelKey: "nav.productsPharmacy" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
  ],
};

export const pharmacyPosNav = {
  admin: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.ordersPharmacy" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
  ],
  staff: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/customers", icon: User, labelKey: "nav.customers" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
