// src/layouts/retail/navItems.js
export const retailWebNav = {
    manager: [
        { to: "/dashboard", label: "Tổng quan", icon: "📊" },
        { to: "/products", label: "Sản phẩm", icon: "📦" },
        { to: "/inventory", label: "Tồn kho", icon: "📊" },
        { to: "/orders", label: "Đơn hàng", icon: "🧾" },
        { to: "/customers", label: "Khách hàng", icon: "👥" },
    ],
    staff: [
        { to: "/products", label: "Sản phẩm", icon: "📦" },
        { to: "/orders", label: "Đơn hàng", icon: "🧾" },
    ],
};

export const retailPosNav = {
    manager: [], // POS layout không dùng sidebar
    staff: [],
};