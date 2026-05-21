// src/routes/routeConfig.jsx
import { lazy } from "react";
import { PERM } from "../constants/shopPermissions.js";
import { ADMIN_PERM } from "../constants/adminPermissions.js";
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
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const AdminPage = lazy(() => import("../pages/admin/AdminPage"));
const AdminLayout = lazy(() => import("../layouts/common/AdminLayout.jsx"));
const AdminSupportPage = lazy(
  () => import("../pages/admin/support/AdminSupportPage.jsx"),
);
const AdminShopListPage = lazy(
  () => import("../pages/admin/shops/AdminShopListPage.jsx"),
);
const AdminShopDetailPage = lazy(
  () => import("../pages/admin/shops/AdminShopDetailPage.jsx"),
);
const AdminUserListPage = lazy(
  () => import("../pages/admin/users/AdminUserListPage.jsx"),
);
const AdminUserDetailPage = lazy(
  () => import("../pages/admin/users/AdminUserDetailPage.jsx"),
);
const AdminBillingPage = lazy(
  () => import("../pages/admin/billing/AdminBillingPage.jsx"),
);
const AdminCatalogPage = lazy(
  () => import("../pages/admin/catalog/AdminCatalogPage.jsx"),
);
const AdminBroadcastPage = lazy(
  () => import("../pages/admin/broadcast/AdminBroadcastPage.jsx"),
);
const AdminAuditPage = lazy(
  () => import("../pages/admin/audit/AdminAuditPage.jsx"),
);
const AdminSecurityPage = lazy(
  () => import("../pages/admin/security/AdminSecurityPage.jsx"),
);
const ShopPage = lazy(() => import("../pages/shops/ShopPage"));
const CreateShopPage = lazy(() => import("../pages/shops/CreateShopPage"));
import DynamicDashboardLayout from "../layouts/DynamicDashboardLayout.jsx";
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));
const ShopSettingsPage = lazy(() => import("../pages/shops/ShopSettingsPage"));
const TaxPolicyPage = lazy(() => import("../pages/shops/TaxPolicyPage"));
const OverviewPage = lazy(() => import("../pages/OverviewPage"));
const ProductListPage = lazy(() => import("../pages/products/ProductListPage"));
const ProductPage = lazy(() => import("../pages/products/ProductPage.jsx"));
const StaffListPage = lazy(() => import("../pages/staffs/StaffListPage"));
const StaffDashboardPage = lazy(
  () => import("../pages/staffs/StaffDashboardPage"),
);
const StaffOverviewPage = lazy(
  () => import("../pages/staffs/StaffOverviewPage"),
);
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
const ContactPage = lazy(() => import("../pages/contact/ContactPage.jsx"));
const NotificationPage = lazy(
  () => import("../pages/notifications/NotificationPage"),
);
const PosPage = lazy(() => import("../pages/pos/PosPage"));
const BillingPage = lazy(() => import("../pages/billing/BillingPage"));
const ShopLayout = lazy(() => import("../layouts/common/ShopLayout.jsx"));
const BranchLayout = lazy(() => import("../layouts/common/BranchLayout.jsx"));
const ProductLayout = lazy(() => import("../layouts/common/ProductLayout.jsx"));

// Public storefront (no auth, no admin layout)
const StorefrontLayout = lazy(
  () => import("../layouts/storefront/StorefrontLayout.jsx"),
);
const StorefrontHomePage = lazy(
  () => import("../pages/storefront/StorefrontHomePage.jsx"),
);
const StorefrontProductDetailPage = lazy(
  () => import("../pages/storefront/StorefrontProductDetailPage.jsx"),
);
const StorefrontCartPage = lazy(
  () => import("../pages/storefront/StorefrontCartPage.jsx"),
);
const StorefrontCheckoutPage = lazy(
  () => import("../pages/storefront/StorefrontCheckoutPage.jsx"),
);
const StorefrontOrderSuccessPage = lazy(
  () => import("../pages/storefront/StorefrontOrderSuccessPage.jsx"),
);
const TableOrderingPage = lazy(
  () => import("../pages/table/TableOrderingPage.jsx"),
);
const LandingPage = lazy(() => import("../pages/landing/LandingPage.jsx"));
const LegalDocumentPage = lazy(() => import("../pages/legal/LegalDocumentPage.jsx"));

export const routeConfig = [
  {
    path: "/terms",
    element: <LegalDocumentPage kind="terms" />,
    titleKey: "routes.terms",
    seoKey: "seo.terms",
    seoPath: "/terms",
  },
  {
    path: "/privacy",
    element: <LegalDocumentPage kind="privacy" />,
    titleKey: "routes.privacy",
    seoKey: "seo.privacy",
    seoPath: "/privacy",
  },
  {
    path: "/landing",
    element: <LandingPage />,
    titleKey: "routes.landing",
    breadcrumbKey: "routes.landing",
    seoKey: "pages.landing.seo",
    seoPath: "/landing",
  },
  {
    path: "/login",
    element: <LoginPage />,
    guestOnly: true,
    titleKey: "routes.login",
    breadcrumbKey: "routes.login",
    seoKey: "seo.login",
    seoPath: "/login",
  },
  {
    path: "/register",
    element: <RegisterPage />,
    guestOnly: true,
    titleKey: "routes.register",
    breadcrumbKey: "routes.registerBreadcrumb",
    seoKey: "seo.register",
    seoPath: "/register",
  },
  {
    path: "/verify",
    element: <VerifyEmailPage />,
    titleKey: "routes.verifyEmail",
    breadcrumbKey: "routes.verifyEmail",
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
    guestOnly: true,
    titleKey: "routes.forgotPassword",
    breadcrumbKey: "routes.forgotPassword",
    seoKey: "seo.forgotPassword",
    seoPath: "/forgot-password",
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
    guestOnly: true,
    titleKey: "routes.resetPassword",
    breadcrumbKey: "routes.resetPassword",
  },
  {
    // Storefront công khai cho guest user — không yêu cầu đăng nhập,
    // không nằm trong DynamicDashboardLayout của admin/POS.
    path: "/s/:slug",
    element: <StorefrontLayout />,
    titleKey: "routes.storefront",
    breadcrumbKey: "routes.storefront",
    children: [
      {
        path: "",
        element: <StorefrontHomePage />,
        titleKey: "routes.storefront",
      },
      {
        path: "products/:productId",
        element: <StorefrontProductDetailPage />,
        titleKey: "routes.storefrontProduct",
      },
      {
        path: "cart",
        element: <StorefrontCartPage />,
        titleKey: "routes.storefrontCart",
      },
      {
        path: "checkout",
        element: <StorefrontCheckoutPage />,
        titleKey: "routes.storefrontCheckout",
      },
      {
        path: "order-success/:orderCode",
        element: <StorefrontOrderSuccessPage />,
        titleKey: "routes.storefrontSuccess",
      },
    ],
  },
  {
    // QR self-ordering tại bàn — guest user, không cần đăng nhập, không có sidebar.
    // shopSlug trong URL chỉ là cosmetic (đẹp hơn); backend resolve qua qrToken.
    path: "/t/:shopSlug/:qrToken",
    element: <TableOrderingPage />,
    titleKey: "routes.tableOrdering",
    breadcrumbKey: "routes.tableOrdering",
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    protected: true,
    roles: ["ROLE_ADMIN"],
    titleKey: "routes.adminHome",
    breadcrumbKey: "routes.adminBreadcrumb",
    children: [
      {
        path: "",
        element: <AdminPage />,
        titleKey: "routes.adminOverview",
        breadcrumbKey: "routes.adminOverviewBreadcrumb",
      },
      {
        path: "support",
        element: <AdminSupportPage />,
        titleKey: "routes.adminSupport",
        breadcrumbKey: "routes.adminSupportBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.SUPPORT_VIEW, ADMIN_PERM.SUPPORT_MANAGE],
      },
      {
        path: "shops",
        element: <AdminShopListPage />,
        titleKey: "routes.adminShops",
        breadcrumbKey: "routes.adminShopsBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.SHOP_VIEW, ADMIN_PERM.SHOP_MANAGE],
      },
      {
        path: "shops/:shopId",
        element: <AdminShopDetailPage />,
        titleKey: "routes.adminShopDetail",
        breadcrumbKey: "routes.adminShopDetailBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.SHOP_VIEW, ADMIN_PERM.SHOP_MANAGE],
      },
      {
        path: "users",
        element: <AdminUserListPage />,
        titleKey: "routes.adminUsers",
        breadcrumbKey: "routes.adminUsersBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.USER_VIEW, ADMIN_PERM.USER_MANAGE],
      },
      {
        path: "users/:userId",
        element: <AdminUserDetailPage />,
        titleKey: "routes.adminUserDetail",
        breadcrumbKey: "routes.adminUserDetailBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.USER_VIEW, ADMIN_PERM.USER_MANAGE],
      },
      {
        path: "billing",
        element: <AdminBillingPage />,
        titleKey: "routes.adminBilling",
        breadcrumbKey: "routes.adminBillingBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.BILLING_VIEW, ADMIN_PERM.BILLING_MANAGE],
      },
      {
        path: "catalog",
        element: <AdminCatalogPage />,
        titleKey: "routes.adminCatalog",
        breadcrumbKey: "routes.adminCatalog",
        adminPermissionAny: [ADMIN_PERM.CATALOG_MANAGE],
      },
      {
        path: "broadcasts",
        element: <AdminBroadcastPage />,
        titleKey: "routes.adminBroadcast",
        breadcrumbKey: "routes.adminBroadcast",
        adminPermissionAny: [ADMIN_PERM.BROADCAST_SEND],
      },
      {
        path: "audit",
        element: <AdminAuditPage />,
        titleKey: "routes.adminAudit",
        breadcrumbKey: "routes.adminAuditBreadcrumb",
        adminPermissionAny: [ADMIN_PERM.AUDIT_VIEW],
      },
      {
        path: "security",
        element: <AdminSecurityPage />,
        titleKey: "routes.adminSecurity",
        breadcrumbKey: "routes.adminSecurityBreadcrumb",
      },
      {
        path: "notifications",
        element: <NotificationPage />,
        titleKey: "routes.adminNotifications",
        breadcrumbKey: "routes.notifications",
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
    titleKey: "routes.unauthorized",
    breadcrumbKey: "routes.unauthorizedBreadcrumb",
  },
  {
    path: "/",
    protected: true,
    guestRedirect: "/landing",
    roles: ["ROLE_USER"],
    element: <DynamicDashboardLayout />,
    children: [
      {
        path: "overview",
        element: <OverviewPage />,
        titleKey: "routes.overview",
        breadcrumbKey: "routes.overview",
        shopPermissionAny: [PERM.SHOP_VIEW],
      },
      {
        path: "products",
        element: <ProductLayout />,
        titleKey: "routes.products",
        breadcrumbKey: "routes.products",
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
        titleKey: "routes.staff",
        breadcrumbKey: "routes.staff",
        shopPermissionAny: [PERM.SHOP_USER_VIEW],
      },
      {
        path: "staffs/dashboard",
        element: <StaffDashboardPage />,
        titleKey: "routes.staffDashboard",
        breadcrumbKey: "routes.staffDashboard",
        shopPermissionAny: [PERM.SHOP_USER_VIEW],
      },
      {
        path: "staffs/:id",
        element: <StaffOverviewPage />,
        titleKey: "routes.staffProfile",
        breadcrumbKey: "routes.staffProfile",
        shopPermissionAny: [PERM.SHOP_USER_VIEW],
      },
      {
        path: "orders",
        element: <OrderListPage />,
        titleKey: "routes.orders",
        breadcrumbKey: "routes.orders",
        shopPermissionAny: [PERM.ORDER_VIEW, PERM.ORDER_CREATE],
      },
      {
        path: "customers",
        element: <CustomerListPage />,
        titleKey: "routes.customers",
        breadcrumbKey: "routes.customers",
        shopPermissionAny: [PERM.CUSTOMER_VIEW],
      },
      {
        path: "inventory",
        element: <InventoryListPage />,
        titleKey: "routes.inventory",
        breadcrumbKey: "routes.inventory",
        shopPermissionAny: [PERM.INVENTORY_VIEW, PERM.INVENTORY_MANAGE],
      },
      {
        path: "reports",
        element: <ReportListPage />,
        titleKey: "routes.reports",
        breadcrumbKey: "routes.reports",
        shopPermissionAny: [PERM.REPORT_VIEW],
      },
      {
        path: "tables",
        element: <TableListPage />,
        titleKey: "routes.tables",
        breadcrumbKey: "routes.tables",
        shopPermissionAny: [
          PERM.TABLE_VIEW,
          PERM.TABLE_CREATE,
          PERM.TABLE_UPDATE,
        ],
      },
      {
        path: "promotions",
        element: <PromotionListPage />,
        titleKey: "routes.promotions",
        breadcrumbKey: "routes.promotions",
        shopPermissionAny: [PERM.PROMOTION_VIEW],
      },
      {
        path: "tax-policies",
        element: <TaxPolicyPage />,
        titleKey: "routes.taxPolicy",
        breadcrumbKey: "routes.taxPolicyBreadcrumb",
        shopPermissionAny: [PERM.SHOP_UPDATE],
      },
      {
        path: "accounts",
        element: <AccountPage />,
        titleKey: "routes.account",
        breadcrumbKey: "routes.account",
      },
      {
        path: "main",
        element: <MainPage />,
        titleKey: "routes.home",
        breadcrumbKey: "routes.home",
      },
      {
        path: "history",
        element: <HistoryPage />,
        titleKey: "routes.history",
        breadcrumbKey: "routes.history",
      },
      {
        path: "contact",
        element: <ContactPage />,
        titleKey: "routes.contact",
        breadcrumbKey: "routes.contact",
      },
      {
        path: "support",
        element: <SupportListPage />,
        titleKey: "routes.support",
        breadcrumbKey: "routes.support",
      },
      {
        path: "notifications",
        element: <NotificationPage />,
        titleKey: "routes.notifications",
        breadcrumbKey: "routes.notifications",
      },
      {
        path: "billing",
        element: <BillingPage />,
        titleKey: "routes.billing",
        breadcrumbKey: "routes.billing",
      },
      {
        path: "pos",
        element: <PosPage />,
        titleKey: "routes.pos",
        breadcrumbKey: "routes.pos",
        shopPermissionAny: [PERM.ORDER_CREATE],
      },
      {
        path: "branches",
        titleKey: "routes.branches",
        breadcrumbKey: "routes.branches",
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
            titleKey: "routes.branchSettings",
            breadcrumbKey: "routes.branchSettings",
          },
          {
            path: "create",
            element: <CreateBranchPage />,
            titleKey: "routes.branchCreate",
            breadcrumbKey: "routes.branchCreate",
          },
        ],
      },
      {
        path: "shops",
        titleKey: "routes.shops",
        breadcrumbKey: "routes.shops",
        element: <ShopLayout />,
        children: [
          {
            path: "",
            element: <ShopPage />,
          },
          {
            path: ":slug",
            element: <ShopSettingsPage />,
            titleKey: "routes.shopDetail",
            breadcrumbKey: "routes.shopDetail",
          },
          {
            path: "create",
            element: <CreateShopPage />,
            titleKey: "routes.shopCreate",
            breadcrumbKey: "routes.shopCreate",
          },
        ],
      },
    ],
  },
  {
    path: "/error",
    element: <ErrorPage />,
    titleKey: "routes.errorPage",
    breadcrumbKey: "routes.errorPage",
  },
  {
    path: "*",
    element: <NotFoundPage />,
    titleKey: "routes.notFound",
    breadcrumbKey: "routes.notFound",
  },
];
