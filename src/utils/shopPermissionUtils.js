// src/utils/shopPermissionUtils.js
// Helper thao tác với tập quyền (Set<string>) trong phạm vi shop hiện tại.

export const normalizePermissionSet = (source) => {
  if (!source) return new Set();
  if (source instanceof Set) return source;
  if (Array.isArray(source)) return new Set(source);
  if (Array.isArray(source?.permissions)) return new Set(source.permissions);
  return new Set();
};

export const hasShopPermission = (set, code) => {
  if (!code) return true;
  const perms = normalizePermissionSet(set);
  return perms.has(code);
};

export const hasAnyShopPermission = (set, codes) => {
  if (!Array.isArray(codes) || codes.length === 0) return true;
  const perms = normalizePermissionSet(set);
  return codes.some((c) => perms.has(c));
};

export const hasAllShopPermissions = (set, codes) => {
  if (!Array.isArray(codes) || codes.length === 0) return true;
  const perms = normalizePermissionSet(set);
  return codes.every((c) => perms.has(c));
};
