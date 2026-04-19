// src/components/common/RequireShopPermission.jsx
import { useShopPermissions } from "../../hooks/useShopPermissions.js";

/**
 * Render children chỉ khi người dùng có đủ quyền yêu cầu trong shop đang chọn.
 *
 * Props:
 *  - permission: string      Một mã quyền duy nhất (VD: "PRODUCT_CREATE").
 *  - any: string[]           Có ít nhất 1 trong danh sách quyền.
 *  - all: string[]           Phải có tất cả quyền trong danh sách.
 *  - fallback: ReactNode     Node hiển thị khi không đủ quyền (mặc định null => ẩn).
 */
const RequireShopPermission = ({
  permission,
  any,
  all,
  fallback = null,
  children,
}) => {
  const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } =
    useShopPermissions();

  let allowed = true;
  if (permission) allowed = allowed && hasShopPermission(permission);
  if (Array.isArray(any) && any.length > 0)
    allowed = allowed && hasAnyShopPermission(any);
  if (Array.isArray(all) && all.length > 0)
    allowed = allowed && hasAllShopPermissions(all);

  return allowed ? children : fallback;
};

export default RequireShopPermission;
