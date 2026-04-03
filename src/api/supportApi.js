import axiosInstance from "./axiosInstance";

const BASE = "/shops";

export const createTicket = (shopId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/support`, data);

export const getTickets = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/support`, { params });

export const getMyTickets = (shopId, params = {}) =>
  axiosInstance.get(`${BASE}/${shopId}/support/my`, { params });

export const getTicket = (shopId, ticketId) =>
  axiosInstance.get(`${BASE}/${shopId}/support/${ticketId}`);

export const replyToTicket = (shopId, ticketId, data) =>
  axiosInstance.post(`${BASE}/${shopId}/support/${ticketId}/reply`, data);

export const updateTicketStatus = (shopId, ticketId, data) =>
  axiosInstance.put(`${BASE}/${shopId}/support/${ticketId}/status`, data);

export const deleteTicket = (shopId, ticketId) =>
  axiosInstance.delete(`${BASE}/${shopId}/support/${ticketId}`);
