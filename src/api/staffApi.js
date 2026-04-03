import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const getStaffList = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/users`, { params });

export const addStaff = (shopId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/users`, data);

export const updateStaffRole = (shopId, userId, data) =>
  axiosInstance.put(`${BASE}/${shopId}/users/${userId}/role`, data);

export const updateStaffPermissions = (shopId, userId, data) =>
  axiosInstance.put(`${BASE}/${shopId}/users/${userId}/permissions`, data);

export const removeStaff = (shopId, userId) =>
  axiosInstance.delete(`${BASE}/${shopId}/users/${userId}`);
