import axiosInstance from "./axiosInstance";

const SUBSCRIPTION_API = "/subscription";

/**
 * Lấy trạng thái subscription của shop hiện tại
 * (status + trial/period ngày còn lại + amount).
 */
export const getCurrentSubscription = () =>
  axiosInstance.get(`${SUBSCRIPTION_API}/me`);

/** Thông tin TK nhận / QR (chưa có mã giao dịch) — hiển thị trên trang billing. */
export const getSubscriptionTransferInfo = () =>
  axiosInstance.get(`${SUBSCRIPTION_API}/transfer-info`);

/**
 * Khởi tạo thanh toán gia hạn. Gateway có thể null để dùng default từ server.
 * @param {{ gateway?: 'MANUAL'|'VNPAY'|'MOMO', returnUrl?: string }} payload
 */
export const startSubscriptionPayment = (payload = {}) =>
  axiosInstance.post(`${SUBSCRIPTION_API}/pay`, payload);

/** Shop báo đã chuyển khoản (giao dịch MANUAL PENDING). payload: { providerTxnRef?: string } */
export const reportSubscriptionManualTransferSent = (payload = {}) =>
  axiosInstance.post(`${SUBSCRIPTION_API}/manual-transfer/reported`, payload);

/** Shop huỷ giao dịch MANUAL đang chờ. payload: { providerTxnRef?: string } */
export const cancelSubscriptionManualTransferPending = (payload = {}) =>
  axiosInstance.post(`${SUBSCRIPTION_API}/manual-transfer/cancel`, payload);

/**
 * Lịch sử thanh toán + thay đổi gói của shop.
 */
export const getSubscriptionHistory = () =>
  axiosInstance.get(`${SUBSCRIPTION_API}/history`);
