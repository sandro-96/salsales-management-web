// src/routes/routeConfig.jsx
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import BranchManagementPage from "../pages/branchs/BranchManagementPage.jsx";
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const ShopSelectPage = lazy(() => import("../pages/shops/ShopSelectPage"));
const CreateShopPage = lazy(() => import("../pages/shops/CreateShopPage"));
const DynamicDashboardLayout = lazy(() => import("../layouts/DynamicDashboardLayout"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ShopSettingsPage = lazy(() => import("../pages/shops/ShopSettingsPage"));
const OverviewPage = lazy(() => import("../pages/OverviewPage"));
const ProductListPage = lazy(() => import("../pages/products/ProductListPage"));
const StaffListPage = lazy(() => import("../pages/staffs/StaffListPage"));
const AlertDemo = lazy(() => import("../pages/AlertDemo"));
const OrderListPage = lazy(() => import("../pages/orders/OrderListPage"));
const CustomerListPage = lazy(() => import("../pages/customers/CustomerListPage"));
const InventoryListPage = lazy(() => import("../pages/inventory/InventoryListPage"));
const ReportListPage = lazy(() => import("../pages/reports/ReportListPage"));
const TableListPage = lazy(() => import("../pages/tables/TableListPage"));
const AccountPage = lazy(() => import("../pages/AccountPage.jsx"));

export const routeConfig = [
    { path: "/login", element: <LoginPage />, guestOnly: true, title: "Đăng nhập" },
    { path: "/alert-demo", element: <AlertDemo />, protected: true, roles: ["ROLE_USER"], title: "Demo Alert" },
    { path: "/register", element: <RegisterPage />, guestOnly: true, title: "Đăng ký tài khoản" },
    { path: "/verify", element: <VerifyEmailPage />, title: "Xác thực email" },
    { path: "/forgot-password", element: <ForgotPasswordPage />, title: "Quên mật khẩu" },

    { path: "/admin", element: <AdminPage />, protected: true, roles: ["ROLE_ADMIN"], title: "Trang quản trị" },
    { path: "/select-shop", element: <ShopSelectPage />, protected: true, roles: ["ROLE_USER"], title: "Chọn cửa hàng" },
    { path: "/create-shop", element: <CreateShopPage />, protected: true, roles: ["ROLE_USER"], title: "Tạo cửa hàng" },
    {
        path: "/",
        protected: true,
        roles: ["ROLE_USER"],
        element: <DynamicDashboardLayout />,
        children: [
            { path: "overview", element: <OverviewPage />, title: "Tổng quan" },
            { path: "products", element: <ProductListPage />, title: "Sản phẩm" },
            { path: "staffs", element: <StaffListPage />, title: "Nhân sự" },
            { path: "branches", element: <BranchManagementPage />, title: "Quản lý Chi nhánh" },
            { path: "orders", element: <OrderListPage />, title: "Đơn hàng" },
            { path: "customers", element: <CustomerListPage />, title: "Khách hàng" },
            { path: "inventory", element: <InventoryListPage />, title: "Kho hàng" },
            { path: "reports", element: <ReportListPage />, title: "Báo cáo" },
            { path: "tables", element: <TableListPage />, title: "Bàn" },
            { path: "/shop-settings", element: <ShopSettingsPage />, title: "Cài đặt cửa hàng" },
            { path: "/accounts", element: <AccountPage />, title: "Cài đặt cửa hàng" },
        ]
    },
    { path: "*", element: <NotFoundPage />, title: "Không tìm thấy trang" },
];