// src/layouts/healthcare/navItems.js
import {
  Home,
  CalendarCheck,
  Stethoscope,
  User,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

export const healthcareWebNav = {
  admin: [
    { to: "/appointments", icon: CalendarCheck, label: "Lịch hẹn" },
    { to: "/doctors", icon: Stethoscope, label: "Bác sĩ" },
    { to: "/patients", icon: User, label: "Bệnh nhân" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/appointments", icon: CalendarCheck, label: "Lịch hẹn" },
    { to: "/doctors", icon: Stethoscope, label: "Bác sĩ" },
    { to: "/patients", icon: User, label: "Bệnh nhân" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
  ],
  staff: [
    { to: "/appointments", icon: CalendarCheck, label: "Lịch hẹn" },
    { to: "/patients", icon: User, label: "Bệnh nhân" },
    { to: "/doctors", icon: Stethoscope, label: "Bác sĩ" },
  ],
};

export const healthcarePosNav = {
  admin: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/appointments", icon: CalendarCheck, label: "Lịch hẹn" },
    { to: "/patients", icon: User, label: "Bệnh nhân" },
  ],
  staff: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/appointments", icon: CalendarCheck, label: "Lịch hẹn" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
