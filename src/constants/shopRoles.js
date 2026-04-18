/**
 * Vai trò thành viên trong shop — khớp enum
 * {@code com.example.sales.constant.ShopRole} (backend).
 *
 * OWNER: chỉ khi tạo shop, không gán qua thêm nhân viên.
 * Quản trị hệ thống: {@code UserRole.ROLE_ADMIN} (không có trong enum shop).
 */

export const SHOP_ROLE = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CASHIER: "CASHIER",
};

/** Gán khi thêm nhân viên / đổi vai trò (không OWNER). */
export const SHOP_ROLES_ASSIGNABLE = [
  { value: SHOP_ROLE.MANAGER, label: "Quản lý" },
  { value: SHOP_ROLE.STAFF, label: "Nhân viên" },
  { value: SHOP_ROLE.CASHIER, label: "Thu ngân" },
];

export const SHOP_ROLE_LABELS = {
  [SHOP_ROLE.OWNER]: "Chủ cửa hàng",
  [SHOP_ROLE.MANAGER]: "Quản lý",
  [SHOP_ROLE.STAFF]: "Nhân viên",
  [SHOP_ROLE.CASHIER]: "Thu ngân",
};

export const SHOP_ROLE_BADGE_VARIANT = {
  [SHOP_ROLE.OWNER]: "default",
  [SHOP_ROLE.MANAGER]: "secondary",
  [SHOP_ROLE.STAFF]: "outline",
  [SHOP_ROLE.CASHIER]: "outline",
};
