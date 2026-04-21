// src/api/adminApi.js
// Các API admin (Roadmap Phase 1 & 2).
import axiosInstance from "./axiosInstance";

// === Me (permissions) ===
export const getAdminPermissions = () =>
  axiosInstance.get("/admin/me/permissions");

// === Dashboard ===
export const getAdminDashboard = () =>
  axiosInstance.get("/admin/dashboard/overview");

// === Shops ===
export const listAdminShops = (params = {}) =>
  axiosInstance.get("/admin/shops", { params });

export const getAdminShopDetail = (shopId, { cacheBust = false } = {}) =>
  axiosInstance.get(`/admin/shops/${shopId}`, {
    params: cacheBust ? { _t: Date.now() } : undefined,
  });

export const updateAdminShopStatus = (shopId, payload) =>
  axiosInstance.patch(`/admin/shops/${shopId}/status`, payload);

export const updateAdminShopPlan = (shopId, payload) =>
  axiosInstance.patch(`/admin/shops/${shopId}/plan`, payload);

export const extendAdminShopPlan = (shopId, payload) =>
  axiosInstance.post(`/admin/shops/${shopId}/plan/extend`, payload);

export const markAdminShopPaid = (shopId, payload = {}) =>
  axiosInstance.post(`/admin/shops/${shopId}/plan/mark-paid`, payload);

export const overrideAdminShopSubscriptionStatus = (shopId, status, reason) =>
  axiosInstance.patch(`/admin/shops/${shopId}/subscription-status`, null, {
    params: { status, ...(reason ? { reason } : {}) },
  });

// === Users ===
export const listAdminUsers = (params = {}) =>
  axiosInstance.get("/admin/users", { params });

export const getAdminUserDetail = (userId) =>
  axiosInstance.get(`/admin/users/${userId}`);

export const updateAdminUserStatus = (userId, payload) =>
  axiosInstance.patch(`/admin/users/${userId}/status`, payload);

export const updateAdminUserPermissions = (userId, payload) =>
  axiosInstance.patch(`/admin/users/${userId}/admin-permissions`, payload);

export const resetAdminUserPassword = (userId) =>
  axiosInstance.post(`/admin/users/${userId}/reset-password`);

export const resendAdminUserVerification = (userId) =>
  axiosInstance.post(`/admin/users/${userId}/resend-verify`);

// === Billing ===
export const getAdminBillingOverview = (params = {}) =>
  axiosInstance.get("/admin/billing/overview", { params });

export const listAdminSubscriptions = (params = {}) =>
  axiosInstance.get("/admin/billing/subscriptions", { params });

export const listAdminPaymentTransactions = (params = {}) =>
  axiosInstance.get("/admin/billing/transactions", { params });

/**
 * Đánh dấu PaymentTransaction (status=PENDING) là CANCELLED/FAILED thủ công.
 * payload: { status: "CANCELLED" | "FAILED", reason: string }
 */
export const resolveAdminPaymentTransaction = (id, payload) =>
  axiosInstance.post(`/admin/billing/transactions/${id}/resolve`, payload);

/**
 * Gọi gateway (VNPay Querydr / MoMo query) để tra trạng thái thực tế cho txn PENDING.
 * Response:
 *   { gatewayStatus, applied, gatewayAmountVnd, gatewayCode, gatewayMessage, transaction }
 * - SUCCESS → backend đã recordPayment + mark SUCCESS (applied=true).
 * - FAILED  → backend đã mark FAILED (applied=true).
 * - PENDING/UNKNOWN → DB không đổi (applied=false); admin có thể retry hoặc resolve thủ công.
 */
export const resyncAdminPaymentTransaction = (id) =>
  axiosInstance.post(`/admin/billing/transactions/${id}/resync`);

// === Catalog ===
export const listAdminCatalog = (params = {}) =>
  axiosInstance.get("/admin/catalog", { params });

export const upsertAdminCatalog = (payload) =>
  axiosInstance.put("/admin/catalog", payload);

export const deleteAdminCatalog = (id) =>
  axiosInstance.delete(`/admin/catalog/${id}`);

// === Broadcast ===
export const listAdminBroadcasts = (params = {}) =>
  axiosInstance.get("/admin/broadcasts", { params });

export const sendAdminBroadcast = (payload) =>
  axiosInstance.post("/admin/broadcasts", payload);

// === Audit logs ===
export const listAdminAuditLogs = (params = {}) =>
  axiosInstance.get("/admin/audit-logs", { params });

// === Impersonation ===
export const startImpersonation = (userId) =>
  axiosInstance.post(`/admin/impersonate/${userId}`);

// === 2FA ===
export const twoFactorSetup = () => axiosInstance.post("/me/2fa/setup");
export const twoFactorVerify = (code) =>
  axiosInstance.post("/me/2fa/verify", { code });
export const twoFactorDisable = (code) =>
  axiosInstance.post("/me/2fa/disable", { code });

// === Session ===
export const getSession = () => axiosInstance.get("/auth/session");
