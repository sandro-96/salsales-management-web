import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const createLeaveRequest = (shopId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/leave-requests`, data);

export const listLeaveRequestsForStaff = (shopId, staffRef, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/leave-requests/staff/${staffRef}`, {
    params,
  });

export const approveLeaveRequest = (shopId, leaveId) =>
  axiosInstance.post(`${BASE}/${shopId}/leave-requests/${leaveId}/approve`);

export const rejectLeaveRequest = (shopId, leaveId, data = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/leave-requests/${leaveId}/reject`, data);

export const cancelLeaveRequest = (shopId, leaveId, data = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/leave-requests/${leaveId}/cancel`, data);

export const leaveShopMonthSummary = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/leave-requests/summary`, { params });

