// src/layouts/ecommerce/navItems.js
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Store,
  Settings,
  Tag,
} from "lucide-react";

export const ecommerceWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: Users, labelKey: "nav.customers" },
    { to: "/inventory", icon: Store, labelKey: "nav.inventoryEcommerce" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: Users, labelKey: "nav.customers" },
    { to: "/inventory", icon: Store, labelKey: "nav.inventoryEcommerce" },
    { to: "/promotions", icon: Tag, labelKey: "nav.promotions" },
    { to: "/reports", icon: BarChart3, labelKey: "nav.reports" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/customers", icon: Users, labelKey: "nav.customers" },
  ],
};

export const ecommercePosNav = {
  admin: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/orders", icon: ShoppingCart, labelKey: "nav.orders" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
  ],
  staff: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/products", icon: Package, labelKey: "nav.products" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
