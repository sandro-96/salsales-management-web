// src/layouts/education/navItems.js
import {
    FaHome, FaBook, FaChalkboardTeacher, FaUserGraduate,
    FaCalendar, FaUsers, FaChartBar, FaCog
} from "react-icons/fa";

export const educationWebNav = {
    admin: [
        { to: "/courses", icon: FaBook, label: "Khóa học" },
        { to: "/teachers", icon: FaChalkboardTeacher, label: "Giảng viên" },
        { to: "/students", icon: FaUserGraduate, label: "Học viên" },
        { to: "/schedule", icon: FaCalendar, label: "Lịch học" }
    ],
    manager: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/courses", icon: FaBook, label: "Khóa học" },
        { to: "/teachers", icon: FaChalkboardTeacher, label: "Giảng viên" },
        { to: "/students", icon: FaUserGraduate, label: "Học viên" },
        { to: "/schedule", icon: FaCalendar, label: "Lịch học" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" }
    ],
    staff: [
        { to: "/courses", icon: FaBook, label: "Khóa học" },
        { to: "/schedule", icon: FaCalendar, label: "Lịch học" },
        { to: "/students", icon: FaUserGraduate, label: "Học viên" }
    ]
};

export const educationPosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/students", icon: FaUserGraduate, label: "Học viên" },
        { to: "/schedule", icon: FaCalendar, label: "Lịch học" }
    ],
    staff: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/schedule", icon: FaCalendar, label: "Lịch học" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" }
    ]
};
