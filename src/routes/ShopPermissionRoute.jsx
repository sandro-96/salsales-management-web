// src/routes/ShopPermissionRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useShop } from "../hooks/useShop.js";
import { useShopPermissions } from "../hooks/useShopPermissions.js";

/**
 * Bảo vệ route con theo quyền trong shop đang chọn.
 *
 * - Nếu chưa ready context shop: render null (để Splash/Providers đảm nhiệm).
 * - Nếu thiếu quyền: điều hướng về `fallbackPath` (mặc định `/accounts`).
 *
 * Có thể dùng cả dạng component hoặc dạng element:
 *   <Route element={<ShopPermissionRoute any={[PERM.PRODUCT_VIEW]}><Outlet /></ShopPermissionRoute>}>
 */
const ShopPermissionRoute = ({
  permission,
  any,
  all,
  fallbackPath = "/accounts",
  children,
}) => {
  const { isShopContextReady, selectedShopId } = useShop();
  const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } =
    useShopPermissions();
  const location = useLocation();

  if (!isShopContextReady) return null;
  if (!selectedShopId) return children;

  let allowed = true;
  if (permission) allowed = allowed && hasShopPermission(permission);
  if (Array.isArray(any) && any.length > 0)
    allowed = allowed && hasAnyShopPermission(any);
  if (Array.isArray(all) && all.length > 0)
    allowed = allowed && hasAllShopPermissions(all);

  if (!allowed) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{ from: location.pathname, reason: "missing_shop_permission" }}
      />
    );
  }

  return children;
};

export default ShopPermissionRoute;
