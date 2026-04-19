import axiosInstance from "./axiosInstance";

// Admin inbox: cross-shop. Route được gate ở backend bằng ROLE_ADMIN
// tại `/api/admin/**` (xem SecurityConfig).
const BASE = "/admin/support";

export const adminListTickets = (params = {}) =>
  axiosInstance.get(BASE, { params });

export const adminGetTicket = (ticketId) =>
  axiosInstance.get(`${BASE}/${ticketId}`);

export const adminReplyTicket = (ticketId, data) =>
  axiosInstance.post(`${BASE}/${ticketId}/reply`, data);

export const adminUpdateTicketStatus = (ticketId, data) =>
  axiosInstance.put(`${BASE}/${ticketId}/status`, data);

export const adminGetTicketStats = () =>
  axiosInstance.get(`${BASE}/stats`);
