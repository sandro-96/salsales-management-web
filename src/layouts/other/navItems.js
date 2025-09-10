// src/layouts/other/navItems.js
import {
  Home,
  CheckSquare,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

export const otherWebNav = {
  admin: [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/tasks", icon: CheckSquare, label: "Công việc" },
    { to: "/users", icon: Users, label: "Người dùng" },
  ],
  manager: [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/tasks", icon: CheckSquare, label: "Công việc" },
    { to: "/users", icon: Users, label: "Người dùng" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
  ],
  staff: [
    { to: "/tasks", icon: CheckSquare, label: "Công việc" },
  ],
};

export const otherPosNav = {
  admin: [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/tasks", icon: CheckSquare, label: "Công việc" },
  ],
  staff: [
    { to: "/tasks", icon: CheckSquare, label: "Công việc" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
