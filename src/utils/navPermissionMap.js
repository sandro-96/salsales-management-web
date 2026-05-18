// src/utils/navPermissionMap.js
// Ánh xạ mặc định giữa path và danh sách quyền cần có ít nhất 1 quyền (requiredAny)
// để hiện mục trên sidebar. Dùng khi navItems không tự khai báo `requiredAny`.
import { PERM } from "../constants/shopPermissions.js";

export const DEFAULT_NAV_PERMISSION_MAP = {
  "/overview": [PERM.SHOP_VIEW],
  "/products": [PERM.PRODUCT_VIEW],
  "/orders": [PERM.ORDER_VIEW, PERM.ORDER_CREATE],
  "/customers": [PERM.CUSTOMER_VIEW],
  "/inventory": [PERM.INVENTORY_VIEW, PERM.INVENTORY_MANAGE],
  "/promotions": [PERM.PROMOTION_VIEW],
  "/tables": [PERM.TABLE_VIEW, PERM.TABLE_CREATE, PERM.TABLE_UPDATE],
  "/branches": [PERM.BRANCH_VIEW, PERM.BRANCH_MANAGE],
  "/reports": [PERM.REPORT_VIEW],
  "/pos": [PERM.ORDER_CREATE],
  "/shops": [PERM.SHOP_VIEW],
};

/**
 * Kiểm tra 1 navItem có được phép hiển thị hay không, ưu tiên cấu hình trực tiếp
 * trên item (`requiredAny` / `requiredAll` / `requiredPermission`), fallback theo `to`.
 *
 * Nếu không có rule nào (không khai báo + không có trong map), mặc định cho hiển thị
 * (áp dụng cho các trang không gắn permission — VD staffs, support dùng role).
 */
export const isNavItemAllowed = (
  item,
  { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions },
) => {
  if (!item) return false;

  if (item.requiredPermission && !hasShopPermission(item.requiredPermission)) {
    return false;
  }
  if (Array.isArray(item.requiredAny) && item.requiredAny.length > 0) {
    return hasAnyShopPermission(item.requiredAny);
  }
  if (Array.isArray(item.requiredAll) && item.requiredAll.length > 0) {
    return hasAllShopPermissions(item.requiredAll);
  }

  const fallback = item.to ? DEFAULT_NAV_PERMISSION_MAP[item.to] : null;
  if (fallback && fallback.length > 0) {
    return hasAnyShopPermission(fallback);
  }

  return true;
};

/**
 * Lọc danh sách navItems theo quyền. Hỗ trợ lồng nhau thông qua trường `items`.
 */
const TABLES_NAV_ITEM = {
  to: "/tables",
  labelKey: "nav.tables",
};

/**
 * Đảm bảo menu Bàn có trên sidebar F&B (nếu layout thiếu hoặc bị lọc nhầm).
 */
export function ensureFnbTablesNav(items, { industry, canAccessTables, TableIcon }) {
  if (industry !== "FNB" || !canAccessTables) return items;
  if (!Array.isArray(items) || items.some((i) => i?.to === "/tables")) {
    return items ?? [];
  }
  const next = [...items];
  const tablesEntry = { ...TABLES_NAV_ITEM, icon: TableIcon };
  const afterOrders = next.findIndex((i) => i.to === "/orders");
  const insertAt = afterOrders >= 0 ? afterOrders + 1 : next.length;
  next.splice(insertAt, 0, tablesEntry);
  return next;
}

export const filterNavByShopPermissions = (navItems, permHelpers, options = {}) => {
  if (options.skipFilter) return Array.isArray(navItems) ? navItems : [];
  if (!Array.isArray(navItems)) return navItems;
  return navItems
    .map((item) => {
      if (Array.isArray(item?.items) && item.items.length > 0) {
        const sub = filterNavByShopPermissions(item.items, permHelpers);
        if (!sub || sub.length === 0) {
          if (!isNavItemAllowed(item, permHelpers)) return null;
          return { ...item, items: [] };
        }
        return { ...item, items: sub };
      }
      return isNavItemAllowed(item, permHelpers) ? item : null;
    })
    .filter(Boolean);
};
