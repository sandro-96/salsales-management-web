import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn accessToken vào mỗi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tự động refresh token nếu accessToken hết hạn
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Bỏ qua logic refresh token nếu request là /auth/refresh-token
    if (originalRequest.url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    // Xử lý lỗi 401 hoặc 403
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn(`HTTP ${status}: Attempting to refresh token...`);

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi refresh-token endpoint sử dụng axiosInstance
        const res = await axiosInstance.post(
          "/auth/refresh-token",
          { refreshToken },
          { headers: { "Content-Type": "application/json" }, timeout: 10000 }
        );

        // Kiểm tra cấu trúc response
        if (!res.data?.data?.accessToken) {
          throw new Error("Invalid refresh token response structure");
        }

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Cập nhật header và thử lại request gốc
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        console.error("Refresh token failed:", err.message);
        // Xóa token và chuyển hướng đến trang đăng nhập
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;