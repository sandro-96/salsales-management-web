// src/layouts/pharmacy/navItems.js
import {
    FaHome, FaCapsules, FaUserFriends, FaStore,
    FaUsers, FaChartBar, FaShoppingCart, FaCog
} from "react-icons/fa";

export const pharmacyWebNav = {
    admin: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn thuốc" },
        { to: "/products", icon: FaCapsules, label: "Thuốc & Sản phẩm" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaCapsules, label: "Kho thuốc" }
    ],
    manager: (logout) => [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/products", icon: FaCapsules, label: "Thuốc & Sản phẩm" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn thuốc" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/branches", icon: FaStore, label: "Chi nhánh" },
        { to: "/inventory", icon: FaCapsules, label: "Kho thuốc" },
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
        { to: "/orders", icon: FaShoppingCart, label: "Đơn thuốc" },
        { to: "/products", icon: FaCapsules, label: "Thuốc & Sản phẩm" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" }
    ]
};

export const pharmacyPosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn thuốc" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
    ],
    staff: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/customers", icon: FaUserFriends, label: "Khách hàng" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" }
    ]
};
