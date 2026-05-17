import axiosInstance from "./axiosInstance";

export const forgotPassword = (email) =>
  axiosInstance.post("/auth/forgot-password", null, {
    params: { email: email.trim() },
  });

export const resetPasswordWithToken = ({ token, newPassword }) =>
  axiosInstance.post("/auth/reset-password", { token, newPassword });
