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
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Utensils, label: "Món ăn / Thực đơn" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: ClipboardList, label: "Kho" },
    { to: "/promotions", icon: Tag, label: "Khuyến mãi" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/products", icon: Utensils, label: "Món ăn / Thực đơn" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: ClipboardList, label: "Kho" },
    { to: "/promotions", icon: Tag, label: "Khuyến mãi" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Utensils, label: "Món ăn / Thực đơn" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
  ],
};

export const fnbPosNav = {
  manager: [],
  admin: [],
  staff: [{ to: "/pos", icon: Utensils, label: "Gọi món" }],
};

