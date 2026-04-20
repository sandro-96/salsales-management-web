import axiosInstance from "./axiosInstance";

const SUBSCRIPTION_API = "/subscription";

/**
 * Lấy trạng thái subscription của shop hiện tại
 * (status + trial/period ngày còn lại + amount).
 */
export const getCurrentSubscription = () =>
  axiosInstance.get(`${SUBSCRIPTION_API}/me`);

/**
 * Khởi tạo thanh toán gia hạn. Gateway có thể null để dùng default từ server.
 * @param {{ gateway?: 'MANUAL'|'VNPAY'|'MOMO', returnUrl?: string }} payload
 */
export const startSubscriptionPayment = (payload = {}) =>
  axiosInstance.post(`${SUBSCRIPTION_API}/pay`, payload);

/**
 * Lịch sử thanh toán + thay đổi gói của shop.
 */
export const getSubscriptionHistory = () =>
  axiosInstance.get(`${SUBSCRIPTION_API}/history`);
