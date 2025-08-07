// src/layouts/ecommerce/navItems.js
import {
    FaHome, FaBoxOpen, FaUsers, FaShoppingCart,
    FaChartLine, FaStore, FaCog
} from "react-icons/fa";

export const ecommerceWebNav = {
    admin: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUsers, label: "Khách hàng" },
        { to: "/inventory", icon: FaStore, label: "Kho hàng" }
    ],
    manager: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUsers, label: "Khách hàng" },
        { to: "/inventory", icon: FaStore, label: "Kho hàng" },
        { to: "/reports", icon: FaChartLine, label: "Báo cáo" }
    ],
    staff: [
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/customers", icon: FaUsers, label: "Khách hàng" }
    ]
};

export const ecommercePosNav = {
    admin: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" }
    ],
    staff: [
        { to: "/overview", icon: FaHome, label: "Tổng quan" },
        { to: "/products", icon: FaBoxOpen, label: "Sản phẩm" },
        { to: "/settings", icon: FaCog, label: "Cài đặt" }
    ]
};
