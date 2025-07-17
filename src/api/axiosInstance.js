// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ➤ Gắn accessToken vào mỗi request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ➤ Tự động refresh token nếu accessToken hết hạn
axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi là 401 và chưa retry lần nào
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");

                // Gọi refresh-token endpoint
                const res = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
                    { refreshToken },
                    { headers: { "Content-Type": "application/json" } }
                );

                const newAccessToken = res.data.data.accessToken;
                localStorage.setItem("accessToken", newAccessToken);

                // Gắn lại accessToken mới và gọi lại request cũ
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                // ❌ Refresh token thất bại → logout
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
