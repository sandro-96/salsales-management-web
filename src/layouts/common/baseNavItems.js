// src/layouts/ecommerce/navItems.js
import {
    FaHome, FaHistory, FaShoppingCart
} from "react-icons/fa";

export const commonWebNav = {
    user: [
        { to: "/main", icon: FaHome, label: "Trang chủ" },
        { to: "/orders", icon: FaShoppingCart, label: "Đơn hàng" },
        { to: "/history", icon: FaHistory, label: "Lịch sử" }
    ]
};
