import axiosInstance from "./axiosInstance";

/**
 * GET /api/promotions?shopId={shopId}&branchId={branchId}&page=0&size=20&sort=startDate,desc
 */
export const getPromotions = (shopId, params = {}) =>
  axiosInstance.get("/promotions", {
    params: { shopId, ...params },
  });

/**
 * POST /api/promotions?shopId={shopId}
 */
export const createPromotion = (shopId, data) =>
  axiosInstance.post("/promotions", data, {
    params: { shopId },
  });

/**
 * PUT /api/promotions/{id}?shopId={shopId}
 */
export const updatePromotion = (id, shopId, data) =>
  axiosInstance.put(`/promotions/${id}`, data, {
    params: { shopId },
  });

/**
 * DELETE /api/promotions/{id}?shopId={shopId}
 */
export const deletePromotion = (id, shopId) =>
  axiosInstance.delete(`/promotions/${id}`, {
    params: { shopId },
  });
