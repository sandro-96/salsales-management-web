// src/layouts/service/navItems.js
import {
    FaHome, FaUserFriends, FaClipboardList,
    FaCalendarAlt, FaChartBar, FaCog, FaUsers
} from "react-icons/fa";

export const serviceWebNav = {
    admin: [
        { to: "/appointments", icon: FaCalendarAlt, label: "Lịch hẹn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/services", icon: FaClipboardList, label: "Dịch vụ" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
    ],
    manager: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/appointments", icon: FaCalendarAlt, label: "Lịch hẹn" },
        { to: "/services", icon: FaClipboardList, label: "Dịch vụ" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" }
    ],
    staff: [
        { to: "/appointments", icon: FaCalendarAlt, label: "Lịch hẹn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/services", icon: FaClipboardList, label: "Dịch vụ" },
    ]
};

export const servicePosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/appointments", icon: FaCalendarAlt, label: "Lịch hẹn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
    ],
    staff: [
        { to: "/appointments", icon: FaCalendarAlt, label: "Lịch hẹn" },
        { to: "/services", icon: FaClipboardList, label: "Dịch vụ" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" },
    ]
};
