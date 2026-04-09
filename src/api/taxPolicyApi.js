import axiosInstance from "./axiosInstance";

/**
 * GET /api/shops/{shopId}/tax-policies
 */
export const getTaxPolicies = (shopId) =>
  axiosInstance.get(`/shops/${shopId}/tax-policies`);

/**
 * POST /api/shops/{shopId}/tax-policies
 */
export const createTaxPolicy = (shopId, data) =>
  axiosInstance.post(`/shops/${shopId}/tax-policies`, data);

/**
 * PUT /api/shops/{shopId}/tax-policies/{policyId}/deactivate
 */
export const deactivateTaxPolicy = (shopId, policyId) =>
  axiosInstance.put(`/shops/${shopId}/tax-policies/${policyId}/deactivate`);
