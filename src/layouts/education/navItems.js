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
    { to: "/courses", icon: BookOpen, labelKey: "nav.courses" },
    { to: "/teachers", icon: Presentation, labelKey: "nav.teachers" },
    { to: "/students", icon: GraduationCap, labelKey: "nav.students" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/courses", icon: BookOpen, labelKey: "nav.courses" },
    { to: "/teachers", icon: Presentation, labelKey: "nav.teachers" },
    { to: "/students", icon: GraduationCap, labelKey: "nav.students" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
    { to: "/staffs", icon: Users, labelKey: "nav.staff" },
  ],
  staff: [
    { to: "/courses", icon: BookOpen, labelKey: "nav.courses" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
    { to: "/students", icon: GraduationCap, labelKey: "nav.students" },
  ],
};

export const educationPosNav = {
  admin: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/students", icon: GraduationCap, labelKey: "nav.students" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
  ],
  staff: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/schedule", icon: Calendar, labelKey: "nav.schedule" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
