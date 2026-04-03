import axiosInstance from "./axiosInstance";

const BASE = "/notifications";

export const getNotifications = (params = {}) =>
  axiosInstance.get(BASE, { params });

export const getUnreadCount = (shopId) =>
  axiosInstance.get(`${BASE}/unread-count`, { params: shopId ? { shopId } : {} });

export const markAsRead = (notificationId) =>
  axiosInstance.put(`${BASE}/${notificationId}/read`);

export const markAllAsRead = (shopId) =>
  axiosInstance.put(`${BASE}/read-all`, null, { params: shopId ? { shopId } : {} });

export const deleteNotification = (notificationId) =>
  axiosInstance.delete(`${BASE}/${notificationId}`);
