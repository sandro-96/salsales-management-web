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
    { to: "/appointments", icon: CalendarCheck, labelKey: "nav.appointments" },
    { to: "/doctors", icon: Stethoscope, labelKey: "nav.doctors" },
    { to: "/patients", icon: User, labelKey: "nav.patients" },
  ],
  manager: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/appointments", icon: CalendarCheck, labelKey: "nav.appointments" },
    { to: "/doctors", icon: Stethoscope, labelKey: "nav.doctors" },
    { to: "/patients", icon: User, labelKey: "nav.patients" },
    { to: "/reports", icon: BarChart, labelKey: "nav.reports" },
    { to: "/staffs", icon: Users, labelKey: "nav.staff" },
  ],
  staff: [
    { to: "/appointments", icon: CalendarCheck, labelKey: "nav.appointments" },
    { to: "/patients", icon: User, labelKey: "nav.patients" },
    { to: "/doctors", icon: Stethoscope, labelKey: "nav.doctors" },
  ],
};

export const healthcarePosNav = {
  admin: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/appointments", icon: CalendarCheck, labelKey: "nav.appointments" },
    { to: "/patients", icon: User, labelKey: "nav.patients" },
  ],
  staff: [
    { to: "/overview", icon: Home, labelKey: "nav.overview" },
    { to: "/appointments", icon: CalendarCheck, labelKey: "nav.appointments" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ],
};
