// src/layouts/education/navItems.js
import {
  Home,
  BookOpen,
  Presentation,
  GraduationCap,
  Calendar,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

export const educationWebNav = {
  admin: [
    { to: "/courses", icon: BookOpen, label: "Khóa học" },
    { to: "/teachers", icon: Presentation, label: "Giảng viên" },
    { to: "/students", icon: GraduationCap, label: "Học viên" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
  ],
  manager: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/courses", icon: BookOpen, label: "Khóa học" },
    { to: "/teachers", icon: Presentation, label: "Giảng viên" },
    { to: "/students", icon: GraduationCap, label: "Học viên" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
    { to: "/reports", icon: BarChart, label: "Báo cáo" },
    { to: "/staffs", icon: Users, label: "Nhân sự" },
  ],
  staff: [
    { to: "/courses", icon: BookOpen, label: "Khóa học" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
    { to: "/students", icon: GraduationCap, label: "Học viên" },
  ],
};

export const educationPosNav = {
  admin: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/students", icon: GraduationCap, label: "Học viên" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
  ],
  staff: [
    { to: "/overview", icon: Home, label: "Tổng quan" },
    { to: "/schedule", icon: Calendar, label: "Lịch học" },
    { to: "/settings", icon: Settings, label: "Cài đặt" },
  ],
};
