import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const getAllStaff = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/staff-profiles`, { params });

export const getStaffProfile = (shopId, userId) =>
  axiosInstance.get(`${BASE}/${shopId}/staff-profiles/${userId}`);

export const saveStaffProfile = (shopId, userId, data) =>
  axiosInstance.put(`${BASE}/${shopId}/staff-profiles/${userId}`, data);

export const deleteStaffProfile = (shopId, userId) =>
  axiosInstance.delete(`${BASE}/${shopId}/staff-profiles/${userId}`);

export const createExternalStaff = (shopId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/staff-profiles/external`, data);

export const getExternalProfile = (shopId, profileId) =>
  axiosInstance.get(`${BASE}/${shopId}/staff-profiles/external/${profileId}`);

export const updateExternalProfile = (shopId, profileId, data) =>
  axiosInstance.put(`${BASE}/${shopId}/staff-profiles/external/${profileId}`, data);

export const deleteExternalProfile = (shopId, profileId) =>
  axiosInstance.delete(`${BASE}/${shopId}/staff-profiles/external/${profileId}`);

export const exportStaffProfiles = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/staff-profiles/export`, {
    params,
    responseType: "blob",
  });
