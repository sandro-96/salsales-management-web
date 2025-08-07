// src/layouts/other/navItems.js
import {
    FaHome, FaTasks, FaUsers, FaChartBar, FaCog
} from "react-icons/fa";

export const otherWebNav = {
    admin: [
        { to: "/dashboard", icon: FaHome, label: "Dashboard" },
        { to: "/tasks", icon: FaTasks, label: "Công việc" },
        { to: "/users", icon: FaUsers, label: "Người dùng" }
    ],
    manager: (logout) => [
        { to: "/dashboard", icon: FaHome, label: "Dashboard" },
        { to: "/tasks", icon: FaTasks, label: "Công việc" },
        { to: "/users", icon: FaUsers, label: "Người dùng" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
        {
            label: "Đăng xuất",
            icon: () => "🚪",
            onClick: (e) => {
                e.preventDefault();
                logout();
            }
        }
    ],
    staff: [
        { to: "/tasks", icon: FaTasks, label: "Công việc" }
    ]
};

export const otherPosNav = {
    admin: [
        { to: "/dashboard", icon: FaHome, label: "Dashboard" },
        { to: "/tasks", icon: FaTasks, label: "Công việc" }
    ],
    staff: [
        { to: "/tasks", icon: FaTasks, label: "Công việc" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" }
    ]
};
