// src/routes/AdminPermissionRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAdminPermissions } from "../hooks/useAdminPermissions.js";
import Loading from "../components/loading/Loading.jsx";

/**
 * Bảo vệ route admin theo AdminPermission. Nếu thiếu quyền sẽ đẩy về `/admin`.
 */
const AdminPermissionRoute = ({
  permission,
  any,
  all,
  fallbackPath = "/admin",
  children,
}) => {
  // Disable admin permission gating on frontend.
  // Backend vẫn có thể enforce quyền (nếu bật), nhưng UI/route phía client không chặn nữa.
  return children;

  const {
    loading,
    hasAdminPermission,
    hasAnyAdminPermission,
    hasAllAdminPermissions,
  } = useAdminPermissions();
  const location = useLocation();

  if (loading) return <Loading />;

  let allowed = true;
  if (permission) allowed = allowed && hasAdminPermission(permission);
  if (Array.isArray(any) && any.length > 0) {
    allowed = allowed && hasAnyAdminPermission(any);
  }
  if (Array.isArray(all) && all.length > 0) {
    allowed = allowed && hasAllAdminPermissions(all);
  }

  if (!allowed) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{ from: location.pathname, reason: "missing_admin_permission" }}
      />
    );
  }

  return children;
};

export default AdminPermissionRoute;
