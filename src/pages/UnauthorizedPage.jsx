// src/pages/UnauthorizedPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin =
    typeof user?.role === "string"
      ? user.role.includes("ROLE_ADMIN")
      : Array.isArray(user?.role)
        ? user.role.includes("ROLE_ADMIN")
        : false;
  const homePath = isAdmin ? "/admin" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background px-4 text-foreground">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg text-center max-w-md w-full border">
        <h1 className="text-4xl font-bold text-foreground mb-3">403</h1>
        <p className="text-muted-foreground mb-6">
          Bạn không có quyền truy cập trang này.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition duration-300 dark:bg-muted dark:hover:bg-muted/80 dark:text-foreground"
          >
            Quay lại
          </button>
          <button
            onClick={() => navigate(homePath)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
