import { SHOP_ROLE } from "@/constants/shopRoles";

/** Loại hình kinh doanh (ShopType enum). */
export function getShopTypeLabel(t, value, fallback) {
  if (!value) return fallback ?? null;
  return t(`pages.shops.shopType.${value}`, {
    defaultValue:
      fallback ?? String(value).replace(/_/g, " "),
  });
}

/** Mô hình kinh doanh (BusinessModel enum). */
export function getBusinessModelLabel(t, value, fallback) {
  if (!value) return fallback ?? null;
  return t(`pages.shops.businessModel.${value}`, {
    defaultValue:
      fallback ?? String(value).replace(/_/g, " "),
  });
}

/** Vai trò trong shop (ShopRole enum). */
export function getShopRoleLabel(t, role) {
  if (!role) return null;
  return t(`pages.shops.role.${role}`, { defaultValue: role });
}

/** Dòng trạng thái gói cho owner (shop switcher, danh sách shop). */
export function formatShopSubscriptionLine(t, status, daysRemaining) {
  if (status == null) return null;
  if (status === "TRIAL") {
    return t("pages.shops.subscription.trialPill", {
      days: daysRemaining ?? 0,
    });
  }
  if (status === "ACTIVE") {
    return t("pages.shops.subscription.activePill", {
      days: daysRemaining ?? 0,
    });
  }
  return t(`pages.shops.subscription.${status}`, { defaultValue: status });
}

/** Vai trò có thể gán khi thêm/sửa nhân viên (không OWNER). */
export function buildShopRolesAssignable(t) {
  return [SHOP_ROLE.MANAGER, SHOP_ROLE.STAFF, SHOP_ROLE.CASHIER].map(
    (value) => ({
      value,
      label: getShopRoleLabel(t, value),
    }),
  );
}
