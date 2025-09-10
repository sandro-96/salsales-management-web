// src/layouts/ecommerce/navItems.js
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Store,
  Settings,
} from "lucide-react";

export const ecommerceWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: Users, label: "Khách hàng" },
    { to: "/inventory", icon: Store, label: "Kho hàng" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: Users, label: "Khách hàng" },
    { to: "/inventory", icon: Store, label: "Kho hàng" },
    { to: "/reports", icon: BarChart3, label: "Báo cáo" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: Users, label: "Khách hàng" },
  ],
};

export const ecommercePosNav = {
  admin: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
  ],
  staff: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
