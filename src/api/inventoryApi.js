import axiosInstance from "./axiosInstance";

/**
 * 📦 Nhập kho — tăng số lượng tồn kho
 * POST /api/shops/{shopId}/inventory/import
 * userId tự động từ JWT, không cần truyền.
 */
export const importProductQuantity = (shopId, { branchId, branchProductId, quantity, note }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/import`, {
    branchId,
    branchProductId,
    type: "IMPORT",
    quantity,
    note,
  });

/**
 * 📦 Xuất kho — giảm số lượng tồn kho
 * POST /api/shops/{shopId}/inventory/export
 */
export const exportProductQuantity = (shopId, { branchId, branchProductId, quantity, note, referenceId }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/export`, {
    branchId,
    branchProductId,
    type: "EXPORT",
    quantity,
    note,
    referenceId,
  });

/**
 * 📦 Điều chỉnh tồn kho — đặt lại số lượng
 * POST /api/shops/{shopId}/inventory/adjust
 * Field `quantity` trong body = newQuantity (số lượng mới).
 */
export const adjustProductQuantity = (shopId, { branchId, branchProductId, quantity, note }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/adjust`, {
    branchId,
    branchProductId,
    type: "ADJUSTMENT",
    quantity,
    note,
  });

/**
 * 📋 Lịch sử giao dịch tồn kho (phân trang)
 * GET /api/shops/{shopId}/inventory/branches/{branchId}/products/{branchProductId}/history
 */
export const getTransactionHistory = (shopId, branchId, branchProductId, params = {}) =>
  axiosInstance.get(
    `/shops/${shopId}/inventory/branches/${branchId}/products/${branchProductId}/history`,
    { params },
  );
