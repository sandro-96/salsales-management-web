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
} from "lucide-react";

export const pharmacyWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn thuốc" },
    { to: "/products", icon: Pill, label: "Thuốc & Sản phẩm" },
    { to: "/customers", icon: User, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: Pill, label: "Kho thuốc" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/products", icon: Pill, label: "Thuốc & Sản phẩm" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn thuốc" },
    { to: "/customers", icon: User, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: Pill, label: "Kho thuốc" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn thuốc" },
    { to: "/products", icon: Pill, label: "Thuốc & Sản phẩm" },
    { to: "/customers", icon: User, label: "Khách hàng" },
  ],
};

export const pharmacyPosNav = {
  admin: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn thuốc" },
    { to: "/customers", icon: User, label: "Khách hàng" },
  ],
  staff: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/customers", icon: User, label: "Khách hàng" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
