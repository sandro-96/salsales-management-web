// src/layouts/healthcare/navItems.js
import {
    FaHome, FaCalendarCheck, FaUserMd, FaUserFriends,
    FaUsers, FaChartBar, FaCog
} from "react-icons/fa";

export const healthcareWebNav = {
    admin: [
        { to: "/appointments", icon: FaCalendarCheck, label: "Lịch hẹn" },
        { to: "/doctors", icon: FaUserMd, label: "Bác sĩ" },
        { to: "/patients", icon: FaUserFriends, label: "Bệnh nhân" }
    ],
    manager: (logout) => [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/appointments", icon: FaCalendarCheck, label: "Lịch hẹn" },
        { to: "/doctors", icon: FaUserMd, label: "Bác sĩ" },
        { to: "/patients", icon: FaUserFriends, label: "Bệnh nhân" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" },
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
        { to: "/appointments", icon: FaCalendarCheck, label: "Lịch hẹn" },
        { to: "/patients", icon: FaUserFriends, label: "Bệnh nhân" },
        { to: "/doctors", icon: FaUserMd, label: "Bác sĩ" }
    ]
};

export const healthcarePosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/appointments", icon: FaCalendarCheck, label: "Lịch hẹn" },
        { to: "/patients", icon: FaUserFriends, label: "Bệnh nhân" }
    ],
    staff: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/appointments", icon: FaCalendarCheck, label: "Lịch hẹn" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" }
    ]
};
