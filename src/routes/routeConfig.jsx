// src/routes/routeConfig.jsx
import path from "path";
import { lazy } from "react";
const BranchFormModal = lazy(() =>
  import("../pages/branchs/BranchFormModal.jsx")
);
const BranchManagementPage = lazy(() =>
  import("../pages/branchs/BranchManagementPage.jsx")
);
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const ShopPage = lazy(() => import("../pages/shops/ShopPage"));
const CreateShopPage = lazy(() => import("../pages/shops/CreateShopPage"));
const DynamicDashboardLayout = lazy(() =>
  import("../layouts/DynamicDashboardLayout")
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ShopSettingsPage = lazy(() => import("../pages/shops/ShopSettingsPage"));
const OverviewPage = lazy(() => import("../pages/OverviewPage"));
const ProductListPage = lazy(() => import("../pages/products/ProductListPage"));
const ProductManagementPage = lazy(() =>
  import("../pages/products/ProductManagementPage")
);
const StaffListPage = lazy(() => import("../pages/staffs/StaffListPage"));
const OrderListPage = lazy(() => import("../pages/orders/OrderListPage"));
const CustomerListPage = lazy(() =>
  import("../pages/customers/CustomerListPage")
);
const InventoryListPage = lazy(() =>
  import("../pages/inventory/InventoryListPage")
);
const ReportListPage = lazy(() => import("../pages/reports/ReportListPage"));
const TableListPage = lazy(() => import("../pages/tables/TableListPage"));
const AccountPage = lazy(() => import("../pages/AccountPage"));
const MainPage = lazy(() => import("../pages/MainPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const ErrorPage = lazy(() => import("../pages/ErrorPage"));
const ShopLayout = lazy(() => import("../layouts/common/ShopLayout.jsx"));

export const routeConfig = [
  {
    path: "/login",
    element: <LoginPage />,
    guestOnly: true,
    title: "Đăng nhập",
    breadcrumb: "Đăng nhập",
  },
  {
    path: "/register",
    element: <RegisterPage />,
    guestOnly: true,
    title: "Đăng ký tài khoản",
    breadcrumb: "Đăng ký",
  },
  {
    path: "/verify",
    element: <VerifyEmailPage />,
    title: "Xác thực email",
    breadcrumb: "Xác thực email",
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
    title: "Quên mật khẩu",
    breadcrumb: "Quên mật khẩu",
  },
  {
    path: "/admin",
    element: <AdminPage />,
    protected: true,
    roles: ["ROLE_ADMIN"],
    title: "Trang quản trị",
    breadcrumb: "Quản trị",
  },
  {
    path: "/",
    protected: true,
    roles: ["ROLE_USER"],
    element: <DynamicDashboardLayout />,
    children: [
      {
        path: "overview",
        element: <OverviewPage />,
        title: "Tổng quan",
        breadcrumb: "Tổng quan",
      },
      {
        path: "products",
        element: <ProductManagementPage />,
        title: "Sản phẩm",
        breadcrumb: "Sản phẩm",
      },
      {
        path: "staffs",
        element: <StaffListPage />,
        title: "Nhân sự",
        breadcrumb: "Nhân sự",
      },
      {
        path: "branches",
        element: <BranchManagementPage />,
        title: "Chi nhánh",
        breadcrumb: "Chi nhánh",
      },
      {
        path: "branches/new",
        element: <BranchFormModal />,
        title: "Thêm chi nhánh",
        breadcrumb: "Thêm chi nhánh",
      },
      {
        path: "orders",
        element: <OrderListPage />,
        title: "Đơn hàng",
        breadcrumb: "Đơn hàng",
      },
      {
        path: "customers",
        element: <CustomerListPage />,
        title: "Khách hàng",
        breadcrumb: "Khách hàng",
      },
      {
        path: "inventory",
        element: <InventoryListPage />,
        title: "Kho hàng",
        breadcrumb: "Kho hàng",
      },
      {
        path: "reports",
        element: <ReportListPage />,
        title: "Báo cáo",
        breadcrumb: "Báo cáo",
      },
      {
        path: "tables",
        element: <TableListPage />,
        title: "Bàn",
        breadcrumb: "Bàn",
      },
      {
        path: "accounts",
        element: <AccountPage />,
        title: "Tài khoản",
        breadcrumb: "Tài khoản",
      },
      {
        path: "main",
        element: <MainPage />,
        title: "Trang chủ",
        breadcrumb: "Trang chủ",
      },
      {
        path: "history",
        element: <HistoryPage />,
        title: "Lịch sử",
        breadcrumb: "Lịch sử",
      },
      {
        path: "shops",
        title: "Cửa hàng",
        breadcrumb: "Cửa hàng",
        element: <ShopLayout />,
        children: [
          {
            path: "",
            element: <ShopPage />,
          },
          {
            path: ":shopId",
            element: <ShopSettingsPage />,
            title: "Chi tiết cửa hàng",
            breadcrumb: "Chi tiết cửa hàng",
          },
          {
            path: "create",
            element: <CreateShopPage />,
            title: "Tạo cửa hàng",
            breadcrumb: "Tạo cửa hàng",
          },
        ],
      },
    ],
  },
  {
    path: "/error",
    element: <ErrorPage />,
    title: "Trang lỗi",
    breadcrumb: "Trang lỗi",
  },
  {
    path: "*",
    element: <NotFoundPage />,
    title: "Không tìm thấy trang",
    breadcrumb: "Không tìm thấy trang",
  },
];
