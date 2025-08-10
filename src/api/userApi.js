import axiosInstance from "./axiosInstance";

const USER_API = "/user";

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getCurrentUser = () => {
    return axiosInstance.get(`${USER_API}/me`);
};

/**
 * Cập nhật thông tin người dùng
 * @param {Object} data { fullName, phone, businessType }
 */
export const updateProfile = (data) => {
    return axiosInstance.put(`${USER_API}/update-profile`, data);
};

/**
 * Đổi mật khẩu
 * @param {Object} data { currentPassword, newPassword }
 */
export const changePassword = (data) => {
    return axiosInstance.post(`${USER_API}/change-password`, data);
};
