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
    { to: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
    { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
    { to: "/users", icon: Users, labelKey: "nav.users" },
  ],
  manager: [
    { to: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
    { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
    { to: "/users", icon: Users, labelKey: "nav.users" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
  ],
  staff: [
    { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
  ],
};

export const otherPosNav = {
  admin: [
    { to: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
    { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
  ],
  staff: [
    { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
