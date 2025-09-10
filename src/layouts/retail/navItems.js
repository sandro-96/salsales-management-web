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
} from "lucide-react";

export const retailWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: User, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: Package, label: "Tồn kho" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: User, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: Package, label: "Tồn kho" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/customers", icon: User, label: "Khách hàng" },
  ],
};

export const retailPosNav = {
  admin: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/customers", icon: User, label: "Khách hàng" },
  ],
  staff: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/products", icon: Package, label: "Sản phẩm" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
