import axiosInstance from "./axiosInstance";

const USER_API = "/user";

/**
 * Build multipart body expected by PUT /api/user/update-profile (@RequestPart "user").
 * @param {Record<string, unknown>} payload
 * @param {File} [avatarFile]
 */
export function buildUpdateProfileFormData(payload, avatarFile) {
  const formData = new FormData();
  formData.append(
    "user",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  if (avatarFile) {
    formData.append("file", avatarFile);
  }
  return formData;
}

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getCurrentUser = () => {
  return axiosInstance.get(`${USER_API}/me`);
};

/**
 * Cập nhật hồ sơ — payload là FormData (từ AccountPage) hoặc object (sync language, v.v.).
 * @param {FormData | Record<string, unknown>} data
 * @param {File} [avatarFile] when data is a plain object and avatar is uploaded separately
 */
export const updateProfile = (data, avatarFile) => {
  const body =
    data instanceof FormData
      ? data
      : buildUpdateProfileFormData(data, avatarFile);

  return axiosInstance.put(`${USER_API}/update-profile`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Đổi mật khẩu
 * @param {Object} data { currentPassword, newPassword }
 */
export const changePassword = (data) => {
  return axiosInstance.post(`${USER_API}/change-password`, data);
};
