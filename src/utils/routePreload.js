/**
 * Prefetch lazy route chunks on menu hover (giảm spinner khi chuyển trang).
 */
const preloaders = {
  "/overview": () => import("../pages/OverviewPage.jsx"),
  "/orders": () => import("../pages/orders/OrderListPage.jsx"),
  "/products": () => import("../pages/products/ProductPage.jsx"),
  "/customers": () => import("../pages/customers/CustomerListPage.jsx"),
  "/inventory": () => import("../pages/inventory/InventoryListPage.jsx"),
  "/reports": () => import("../pages/reports/ReportListPage.jsx"),
  "/pos": () => import("../pages/pos/PosPage.jsx"),
  "/staffs": () => import("../pages/staffs/StaffListPage.jsx"),
  "/promotions": () => import("../pages/promotions/PromotionListPage.jsx"),
  "/billing": () => import("../pages/billing/BillingPage.jsx"),
  "/accounts": () => import("../pages/AccountPage.jsx"),
};

export function preloadRoute(path) {
  if (!path || typeof path !== "string") return;
  const normalized = path.split("?")[0].replace(/\/+$/, "") || "/";
  const fn = preloaders[normalized];
  if (fn) void fn();
}
