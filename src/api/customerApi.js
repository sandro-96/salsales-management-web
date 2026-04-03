import axiosInstance from "./axiosInstance";

/**
 * GET /api/customers?shopId=&branchId=&keyword=&page=0&size=20&sortBy=createdAt&sortDir=desc
 */
export const getCustomers = (shopId, params = {}) =>
  axiosInstance.get("/customers", {
    params: { shopId, ...params },
  });

/**
 * GET /api/customers/{id}?shopId=
 */
export const getCustomerById = (id, shopId) =>
  axiosInstance.get(`/customers/${id}`, {
    params: { shopId },
  });

/**
 * POST /api/customers?shopId=
 */
export const createCustomer = (shopId, data) =>
  axiosInstance.post("/customers", data, {
    params: { shopId },
  });

/**
 * PUT /api/customers/{id}?shopId=
 */
export const updateCustomer = (id, shopId, data) =>
  axiosInstance.put(`/customers/${id}`, data, {
    params: { shopId },
  });

/**
 * DELETE /api/customers/{id}?shopId=&branchId=
 */
export const deleteCustomer = (id, shopId, branchId) =>
  axiosInstance.delete(`/customers/${id}`, {
    params: { shopId, branchId },
  });

/**
 * GET /api/customers/export?shopId=&branchId=&keyword=&fromDate=&toDate=
 */
export const exportCustomers = (shopId, params = {}) =>
  axiosInstance.get("/customers/export", {
    params: { shopId, ...params },
    responseType: "blob",
  });
