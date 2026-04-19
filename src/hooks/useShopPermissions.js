// src/hooks/useShopPermissions.js
import { useShop } from "./useShop.js";

/**
 * Trả về các tiện ích kiểm tra quyền trong phạm vi shop đang chọn.
 */
export const useShopPermissions = () => {
  const {
    shopPermissions,
    hasShopPermission,
    hasAnyShopPermission,
    hasAllShopPermissions,
  } = useShop();

  return {
    shopPermissions,
    hasShopPermission,
    hasAnyShopPermission,
    hasAllShopPermissions,
  };
};
