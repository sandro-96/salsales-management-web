// src/layouts/service/navItems.js
import {
  FaHome,
  FaUserFriends,
  FaClipboardList,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaUsers,
} from "react-icons/fa";

export const serviceWebNav = {
  admin: [
    { to: "/appointments", icon: FaCalendarAlt, labelKey: "nav.appointments" },
    { to: "/customers", icon: FaUserFriends, labelKey: "nav.customers" },
    { to: "/services", icon: FaClipboardList, labelKey: "nav.services" },
    { to: "/staffs", icon: FaUsers, labelKey: "nav.staff" },
    { to: "/reports", icon: FaChartBar, labelKey: "nav.reports" },
  ],
  manager: [
    { to: "/overview", icon: FaHome, labelKey: "nav.overview" },
    { to: "/appointments", icon: FaCalendarAlt, labelKey: "nav.appointments" },
    { to: "/services", icon: FaClipboardList, labelKey: "nav.services" },
    { to: "/customers", icon: FaUserFriends, labelKey: "nav.customers" },
    { to: "/staffs", icon: FaUsers, labelKey: "nav.staff" },
    { to: "/reports", icon: FaChartBar, labelKey: "nav.reports" },
  ],
  staff: [
    { to: "/appointments", icon: FaCalendarAlt, labelKey: "nav.appointments" },
    { to: "/customers", icon: FaUserFriends, labelKey: "nav.customers" },
    { to: "/services", icon: FaClipboardList, labelKey: "nav.services" },
  ],
};

export const servicePosNav = {
  admin: [
    { to: "/overview", icon: FaHome, labelKey: "nav.overview" },
    { to: "/appointments", icon: FaCalendarAlt, labelKey: "nav.appointments" },
    { to: "/customers", icon: FaUserFriends, labelKey: "nav.customers" },
  ],
  staff: [
    { to: "/appointments", icon: FaCalendarAlt, labelKey: "nav.appointments" },
    { to: "/services", icon: FaClipboardList, labelKey: "nav.services" },
    { to: "/settings", icon: FaCog, labelKey: "nav.settings" },
  ],
};
