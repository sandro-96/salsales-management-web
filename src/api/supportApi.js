import axiosInstance from "./axiosInstance";

/** Ticket hỗ trợ user ↔ admin, không gắn shop (`/api/user/support`). */
const BASE = "/user/support";

export const createTicket = (data) => axiosInstance.post(BASE, data);

export const listMyTickets = (params = {}) =>
  axiosInstance.get(BASE, { params });

export const getTicket = (ticketId) =>
  axiosInstance.get(`${BASE}/${ticketId}`);

export const replyToTicket = (ticketId, data) =>
  axiosInstance.post(`${BASE}/${ticketId}/reply`, data);

export const updateTicketStatus = (ticketId, data) =>
  axiosInstance.put(`${BASE}/${ticketId}/status`, data);

export const deleteTicket = (ticketId) =>
  axiosInstance.delete(`${BASE}/${ticketId}`);
