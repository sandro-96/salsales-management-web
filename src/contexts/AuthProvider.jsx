// src/contexts/AuthProvider.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "./AuthContext";
import { getCurrentUser } from "../api/userApi"; // import thêm

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [enums, setEnums] = useState(null);
  const [isUserContextReady, setIsUserContextReady] = useState(false);
  const hasHydratedUserRef = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("selectedShopId");
    localStorage.removeItem("selectedBranchId");
    setUser(null);
    hasHydratedUserRef.current = false;
    navigate("/landing");
  }, [navigate]);

  const fetchEnums = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/enums/all");
      setEnums(res.data.data);
    } catch (err) {
      console.error("Lỗi khi tải enums:", err);
    }
  }, []);

  /**
   * @param {{ silent?: boolean }} options
   * silent=true: không chặn UI (refresh token / cập nhật profile).
   */
  const loadUser = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      hasHydratedUserRef.current = false;
      setIsUserContextReady(true);
      return;
    }

    if (!silent && !hasHydratedUserRef.current) {
      setIsUserContextReady(false);
    }

    try {
      // decode token để check nhanh
      const decoded = jwtDecode(token);

      // gọi API để lấy thông tin chi tiết
      const res = await getCurrentUser();

      const profile = res.data.data;
      setUser({
        id: decoded.sub,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      });
      hasHydratedUserRef.current = true;
    } catch (err) {
      console.error("Không load được user:", err);
      logout();
    } finally {
      setIsUserContextReady(true);
    }
  }, [logout]);

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return logout();

    try {
      const res = await axiosInstance.post("/auth/refresh-token", {
        refreshToken,
      });
      localStorage.setItem("accessToken", res.data.data.accessToken);
      await loadUser({ silent: true });
    } catch {
      logout();
    }
  }, [loadUser, logout]);

  useEffect(() => {
    loadUser({ silent: false });
    // Chỉ hydrate user một lần khi app mount — không gắn loadUser vào deps (tránh /user/me mỗi lần đổi route).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        logout,
        refreshToken,
        setUser,
        enums,
        isUserContextReady,
        fetchEnums,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
