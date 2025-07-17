// src/routes/routeConfig.jsx
import { lazy } from "react";
import { Navigate } from "react-router-dom";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const ShopSelectPage = lazy(() => import("../pages/shop/ShopSelectPage"));
const CreateShopPage = lazy(() => import("../pages/shop/CreateShopPage"));
const OverviewPage = lazy(() => import("../pages/OverviewPage"));
const ProductListPage = lazy(() => import("../pages/products/ProductListPage"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ShopSettingsPage = lazy(() => import("../pages/shop/ShopSettingsPage"));

export const routeConfig = [
    { path: "/login", element: <LoginPage />, guestOnly: true, title: "Đăng nhập" },
    { path: "/register", element: <RegisterPage />, guestOnly: true, title: "Đăng ký tài khoản" },
    { path: "/verify", element: <VerifyEmailPage />, title: "Xác thực email" },
    { path: "/forgot-password", element: <ForgotPasswordPage />, title: "Quên mật khẩu" },

    { path: "/admin", element: <AdminPage />, protected: true, roles: ["ROLE_ADMIN"], title: "Trang quản trị" },
    { path: "/select-shop", element: <ShopSelectPage />, protected: true, roles: ["ROLE_USER"], title: "Chọn cửa hàng" },
    { path: "/create-shop", element: <CreateShopPage />, protected: true, roles: ["ROLE_USER"], title: "Tạo cửa hàng" },
    {
        path: "/shop-settings",
        element: <ShopSettingsPage />,
        protected: true,
        roles: ["ROLE_USER"],
        title: "Cài đặt cửa hàng",
    },
    {
        path: "/",
        protected: true,
        roles: ["ROLE_USER"],
        element: <DashboardLayout />,
        children: [
            { index: true, element: <Navigate to="overview" /> },
            { path: "overview", element: <OverviewPage />, title: "Tổng quan" },
            { path: "products", element: <ProductListPage />, title: "Sản phẩm" },
        ],
    },
    { path: "*", element: <NotFoundPage />, title: "Không tìm thấy trang" },
];