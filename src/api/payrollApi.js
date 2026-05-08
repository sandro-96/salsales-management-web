import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const payrollGenerate = (shopId, params = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/payroll/generate`, null, { params });

export const payrollGetRun = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/payroll`, { params });

export const payrollFinalize = (shopId, params = {}) =>
  axiosInstance.post(`${BASE}/${shopId}/payroll/finalize`, null, { params });

export const payrollGetStaffMonth = (shopId, staffRef, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/payroll/staff/${staffRef}`, { params });

