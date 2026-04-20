import axiosInstance from "./axiosInstance";

/**
 * 📦 Nhập kho — tăng số lượng tồn kho
 * POST /api/shops/{shopId}/inventory/import
 * userId tự động từ JWT, không cần truyền.
 */
export const importProductQuantity = (shopId, { branchId, branchProductId, variantId, quantity, note }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/import`, {
    branchId,
    branchProductId,
    variantId: variantId || undefined,
    type: "IMPORT",
    quantity,
    note,
  });

/**
 * 📦 Xuất kho — giảm số lượng tồn kho
 * POST /api/shops/{shopId}/inventory/export
 */
export const exportProductQuantity = (shopId, { branchId, branchProductId, variantId, quantity, note, referenceId }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/export`, {
    branchId,
    branchProductId,
    variantId: variantId || undefined,
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
export const adjustProductQuantity = (shopId, { branchId, branchProductId, variantId, quantity, note }) =>
  axiosInstance.post(`/shops/${shopId}/inventory/adjust`, {
    branchId,
    branchProductId,
    variantId: variantId || undefined,
    type: "ADJUSTMENT",
    quantity,
    note,
  });

/**
 * ⚖️ Nhập tồn theo cân cho SP sellByWeight
 * POST /api/shops/{shopId}/inventory/import-weight
 * weight: số thực theo đơn vị tự nhiên (kg/g/l/ml); server tự quy đổi về base unit (gram/ml).
 * unit (optional): override product.unit.
 */
export const importProductWeight = (
  shopId,
  { branchId, branchProductId, weight, unit, note },
) =>
  axiosInstance.post(`/shops/${shopId}/inventory/import-weight`, {
    branchId,
    branchProductId,
    weight,
    unit: unit || undefined,
    note,
  });

/**
 * ⚖️ Xuất tồn theo cân (kiểm kê / hao hụt).
 * POST /api/shops/{shopId}/inventory/export-weight
 */
export const exportProductWeight = (
  shopId,
  { branchId, branchProductId, weight, unit, note, referenceId },
) =>
  axiosInstance.post(`/shops/${shopId}/inventory/export-weight`, {
    branchId,
    branchProductId,
    weight,
    unit: unit || undefined,
    note,
    referenceId,
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
