// src/routes/routeConfig.jsx
import { lazy } from "react";
import { PERM } from "../constants/shopPermissions.js";
const BranchPage = lazy(() => import("../pages/branchs/BranchPage.jsx"));
const BranchSettingsPage = lazy(
  () => import("../pages/branchs/BranchSettingsPage.jsx"),
);
const CreateBranchPage = lazy(
  () => import("../pages/branchs/CreateBranchPage.jsx"),
);
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const AdminLayout = lazy(() => import("../layouts/common/AdminLayout.jsx"));
const AdminSupportPage = lazy(
  () => import("../pages/admin/support/AdminSupportPage.jsx"),
);
const ShopPage = lazy(() => import("../pages/shops/ShopPage"));
const CreateShopPage = lazy(() => import("../pages/shops/CreateShopPage"));
const DynamicDashboardLayout = lazy(
  () => import("../layouts/DynamicDashboardLayout"),
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));
const ShopSettingsPage = lazy(() => import("../pages/shops/ShopSettingsPage"));
const TaxPolicyPage = lazy(() => import("../pages/shops/TaxPolicyPage"));
const OverviewPage = lazy(() => import("../pages/OverviewPage"));
const ProductListPage = lazy(() => import("../pages/products/ProductListPage"));
const ProductPage = lazy(() => import("../pages/products/ProductPage.jsx"));
const StaffListPage = lazy(() => import("../pages/staffs/StaffListPage"));
const OrderListPage = lazy(() => import("../pages/orders/OrderListPage"));
const CustomerListPage = lazy(
  () => import("../pages/customers/CustomerListPage"),
);
const InventoryListPage = lazy(
  () => import("../pages/inventory/InventoryListPage"),
);
const ReportListPage = lazy(() => import("../pages/reports/ReportListPage"));
const TableListPage = lazy(() => import("../pages/tables/TableListPage"));
const PromotionListPage = lazy(
  () => import("../pages/promotions/PromotionListPage"),
);
const AccountPage = lazy(() => import("../pages/AccountPage"));
const MainPage = lazy(() => import("../pages/MainPage"));
const HistoryPage = lazy(() => import("../pages/HistoryPage"));
const ErrorPage = lazy(() => import("../pages/ErrorPage"));
const SupportListPage = lazy(
  () => import("../pages/support/SupportListPage"),
);
const NotificationPage = lazy(
  () => import("../pages/notifications/NotificationPage"),
);
const PosPage = lazy(() => import("../pages/pos/PosPage"));
const ShopLayout = lazy(() => import("../layouts/common/ShopLayout.jsx"));
const BranchLayout = lazy(() => import("../layouts/common/BranchLayout.jsx"));
const ProductLayout = lazy(() => import("../layouts/common/ProductLayout.jsx"));

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
    element: <AdminLayout />,
    protected: true,
    roles: ["ROLE_ADMIN"],
    title: "Trang quản trị",
    breadcrumb: "Quản trị",
    children: [
      {
        path: "",
        element: <AdminPage />,
        title: "Tổng quan quản trị",
        breadcrumb: "Tổng quan",
      },
      {
        path: "support",
        element: <AdminSupportPage />,
        title: "Hỗ trợ hệ thống",
        breadcrumb: "Hỗ trợ",
      },
      {
        path: "notifications",
        element: <NotificationPage />,
        title: "Thông báo (admin)",
        breadcrumb: "Thông báo",
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
    title: "Không có quyền truy cập",
    breadcrumb: "Không có quyền",
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
        shopPermissionAny: [PERM.SHOP_VIEW],
      },
      {
        path: "products",
        element: <ProductLayout />,
        title: "Sản phẩm",
        breadcrumb: "Sản phẩm",
        shopPermissionAny: [PERM.PRODUCT_VIEW],
        children: [
          {
            path: "",
            element: <ProductPage />,
          },
        ],
      },
      {
        path: "staffs",
        element: <StaffListPage />,
        title: "Nhân sự",
        breadcrumb: "Nhân sự",
        shopPermissionAny: [PERM.SHOP_USER_VIEW],
      },
      {
        path: "orders",
        element: <OrderListPage />,
        title: "Đơn hàng",
        breadcrumb: "Đơn hàng",
        shopPermissionAny: [PERM.ORDER_VIEW, PERM.ORDER_CREATE],
      },
      {
        path: "customers",
        element: <CustomerListPage />,
        title: "Khách hàng",
        breadcrumb: "Khách hàng",
        shopPermissionAny: [PERM.CUSTOMER_VIEW],
      },
      {
        path: "inventory",
        element: <InventoryListPage />,
        title: "Kho hàng",
        breadcrumb: "Kho hàng",
        shopPermissionAny: [PERM.INVENTORY_VIEW, PERM.INVENTORY_MANAGE],
      },
      {
        path: "reports",
        element: <ReportListPage />,
        title: "Báo cáo",
        breadcrumb: "Báo cáo",
        shopPermissionAny: [PERM.REPORT_VIEW],
      },
      {
        path: "tables",
        element: <TableListPage />,
        title: "Bàn",
        breadcrumb: "Bàn",
        shopPermissionAny: [PERM.TABLE_VIEW],
      },
      {
        path: "promotions",
        element: <PromotionListPage />,
        title: "Khuyến mãi",
        breadcrumb: "Khuyến mãi",
        shopPermissionAny: [PERM.PROMOTION_VIEW],
      },
      {
        path: "tax-policies",
        element: <TaxPolicyPage />,
        title: "Chính sách thuế",
        breadcrumb: "Thuế",
        shopPermissionAny: [PERM.SHOP_UPDATE],
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
        path: "support",
        element: <SupportListPage />,
        title: "Hỗ trợ",
        breadcrumb: "Hỗ trợ",
      },
      {
        path: "notifications",
        element: <NotificationPage />,
        title: "Thông báo",
        breadcrumb: "Thông báo",
      },
      {
        path: "pos",
        element: <PosPage />,
        title: "Bán hàng",
        breadcrumb: "Bán hàng",
        shopPermissionAny: [PERM.ORDER_CREATE],
      },
      {
        path: "branches",
        title: "Chi nhánh",
        breadcrumb: "Chi nhánh",
        element: <BranchLayout />,
        shopPermissionAny: [PERM.BRANCH_VIEW, PERM.BRANCH_MANAGE],
        children: [
          {
            path: "",
            element: <BranchPage />,
          },
          {
            path: ":slug",
            element: <BranchSettingsPage />,
            title: "Cài đặt chi nhánh",
            breadcrumb: "Cài đặt chi nhánh",
          },
          {
            path: "create",
            element: <CreateBranchPage />,
            title: "Tạo chi nhánh",
            breadcrumb: "Tạo chi nhánh",
          },
        ],
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
            path: ":slug",
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
