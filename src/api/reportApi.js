import axiosInstance from "./axiosInstance";

/**
 * POST /api/reports/summary?shopId=
 */
export const getReportSummary = (shopId, data) =>
  axiosInstance.post("/reports/summary", data, {
    params: { shopId },
  });

/**
 * POST /api/reports/daily?shopId=
 */
export const getDailyReport = (shopId, data) =>
  axiosInstance.post("/reports/daily", data, {
    params: { shopId },
  });

/**
 * POST /api/reports/top-products?shopId=&limit=
 */
export const getTopProducts = (shopId, data, limit = 10) =>
  axiosInstance.post("/reports/top-products", data, {
    params: { shopId, limit },
  });

/**
 * GET /api/reports/daily/export?shopId=&startDate=&endDate=&branchId=
 */
export const exportDailyReport = (shopId, params = {}) =>
  axiosInstance.get("/reports/daily/export", {
    params: { shopId, ...params },
    responseType: "blob",
  });

/**
 * POST /api/reports/top-products/export?shopId=&limit=
 */
export const exportTopProducts = (shopId, data, limit = 10) =>
  axiosInstance.post("/reports/top-products/export", data, {
    params: { shopId, limit },
    responseType: "blob",
  });
