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
  LifeBuoy,
  Bell,
} from "lucide-react";

export const fnbWebNav = {
  admin: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Utensils, label: "Menu" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: ClipboardList, label: "Kho" },
    { to: "/promotions", icon: Tag, label: "Khuyến mãi" },
    { to: "/support", icon: LifeBuoy, label: "Hỗ trợ" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/products", icon: Utensils, label: "Menu" },
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/inventory", icon: ClipboardList, label: "Kho" },
    { to: "/promotions", icon: Tag, label: "Khuyến mãi" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
    { to: "/support", icon: LifeBuoy, label: "Hỗ trợ" },
  ],
  staff: [
    { to: "/orders", icon: ShoppingCart, label: "Đơn hàng" },
    { to: "/products", icon: Utensils, label: "Menu" },
    { to: "/tables", icon: Table, label: "Bàn" },
    { to: "/customers", icon: UserCircle, label: "Khách hàng" },
    { to: "/branches", icon: Store, label: "Chi nhánh" },
    { to: "/support", icon: LifeBuoy, label: "Hỗ trợ" },
  ],
};

export const fnbPosNav = {
  admin: [{ to: "/pos", icon: Utensils, label: "Gọi món" }],
  manager: [{ to: "/pos", icon: Utensils, label: "Gọi món" }],
  staff: [{ to: "/pos", icon: Utensils, label: "Gọi món" }],
};
