// src/layouts/fnb/navItems.js
import {
    FaHome, FaUtensils, FaUsers, FaShoppingCart,
    FaTable, FaUserFriends, FaStore, FaChartBar
} from "react-icons/fa";

export const fnbWebNav = {
    admin: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaUtensils, label: "Món ăn / Thực đơn" },
        { to: "/tables", icon: FaTable, label: "Bàn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaUtensils, label: "Kho" }
    ],
    manager: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/products", icon: FaUtensils, label: "Món ăn / Thực đơn" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/tables", icon: FaTable, label: "Bàn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaUtensils, label: "Kho" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" }
    ],
    staff: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaUtensils, label: "Món ăn / Thực đơn" },
        { to: "/tables", icon: FaTable, label: "Bàn" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" }
    ]
};

export const fnbPosNav = {
    manager: [],
    admin: [],
    staff: [
        { to: "/pos", icon: FaUtensils, label: "Gọi món" }
    ]
};
