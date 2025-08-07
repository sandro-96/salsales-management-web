// src/layouts/retail/navItems.js
import {
    FaHome, FaShoppingCart, FaBoxOpen,
    FaUserFriends, FaStore, FaUsers,
    FaChartBar, FaCog
} from "react-icons/fa";

export const retailWebNav = {
    admin: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaBoxOpen, label: "Tồn kho" },
    ],
    manager: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaBoxOpen, label: "Tồn kho" },
        { to: "/reports", icon: FaChartBar, label: "Báo cáo" },
        { to: "/staffs", icon: FaUsers, label: "Nhân sự" }
    ],
    staff: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
    ]
};

export const retailPosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
    ],
    staff: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" },
    ]
};
