// src/contexts/AuthProvider.jsx
import { useCallback, useEffect, useState } from "react";
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

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("selectedShopId");
    localStorage.removeItem("selectedBranchId");
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const fetchEnums = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/enums/all");
      setEnums(res.data.data);
    } catch (err) {
      console.error("Lỗi khi tải enums:", err);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsUserContextReady(true);
      return;
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
      await loadUser();
    } catch {
      logout();
    }
  }, [loadUser, logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
