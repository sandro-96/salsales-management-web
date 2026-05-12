import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const attendanceCheckIn = (shopId, data = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/attendance/check-in`, data);

export const attendanceCheckOut = (shopId, data = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/attendance/check-out`, data);

/** Owner/Manager: nhập giờ vào / giờ ra theo ngày cho nhân viên. */
export const attendanceManualSession = (shopId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/attendance/manual-session`, data);

export const attendanceDaySummary = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/attendance/day`, { params });

export const attendanceStaffMonthSummary = (
  shopId,
  staffRef,
  params = {},
) =>
  axiosInstance.get(`${BASE}/${shopId}/attendance/staff/${staffRef}/month`, {
    params,
  });

