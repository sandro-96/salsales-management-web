import axios from "axios";
import { jwtDecode } from "jwt-decode";
import i18n, { LANGUAGE_STORAGE_KEY } from "@/i18n";
import { isRetryableGetError } from "@/utils/networkError.js";

const GET_RETRY_MAX = 2;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Không gắn X-Shop-Id — tránh 4002 khi user chưa có shop hoặc id cũ trong localStorage. */
const PATHS_WITHOUT_SHOP_HEADER = [
  "/shop/my",
  "/user/",
  "/notifications",
  "/auth/",
  "/enums",
];

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn accessToken vào mỗi request
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers = config.headers ?? {};
    const lang =
      i18n.language ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem(LANGUAGE_STORAGE_KEY)
        : null) ||
      "vi";
    const acceptLanguage = lang.startsWith("en") ? "en" : "vi";
    if (typeof config.headers.set === "function") {
      config.headers.set("Accept-Language", acceptLanguage);
    } else {
      config.headers["Accept-Language"] = acceptLanguage;
    }
    // FormData cần boundary do trình duyệt/axios gắn — bỏ default application/json
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Axios v1 may use AxiosHeaders; support both plain object & set()
      if (typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
      try {
        const decoded = jwtDecode(token);
        // Some tokens use `sub` (email/username) while app storage keys use `user.id`.
        // Try multiple common keys and fall back to legacy shared key.
        const candidates = [
          decoded?.id,
          decoded?.userId,
          decoded?.uid,
          decoded?.sub,
        ]
          .map((v) => (v == null ? null : String(v)))
          .filter(Boolean);

        let sid = null;
        for (const uid of candidates) {
          sid = localStorage.getItem(`selectedShopId:${uid}`);
          if (sid) break;
        }
        if (!sid) sid = localStorage.getItem("selectedShopId");

        const url = config.url || "";
        const skipShopHeader = PATHS_WITHOUT_SHOP_HEADER.some((p) =>
          url.includes(p),
        );

        if (sid && !skipShopHeader) {
          if (typeof config.headers.set === "function") {
            config.headers.set("X-Shop-Id", sid);
          } else {
            config.headers["X-Shop-Id"] = sid;
          }
        }
      } catch {
        /* token không decode được — bỏ qua X-Shop-Id */
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Tự động refresh token nếu accessToken hết hạn
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const method = (originalRequest.method || "get").toLowerCase();
    const retryCount = originalRequest.__getRetryCount || 0;
    if (
      method === "get" &&
      retryCount < GET_RETRY_MAX &&
      isRetryableGetError(error) &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest.__getRetryCount = retryCount + 1;
      await sleep(400 * originalRequest.__getRetryCount);
      return axiosInstance(originalRequest);
    }

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
          { headers: { "Content-Type": "application/json" }, timeout: 10000 },
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
  },
);

export default axiosInstance;
