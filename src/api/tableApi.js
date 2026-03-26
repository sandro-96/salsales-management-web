import axiosInstance from "./axiosInstance";

/**
 * 📋 Lấy danh sách bàn (phân trang)
 * GET /api/tables?shopId={shopId}&branchId={branchId}
 */
export const getTables = (shopId, branchId, params = {}) =>
  axiosInstance.get(`shops/${shopId}/tables`, {
    params: { branchId, ...params },
  });

/**
 * ➕ Tạo bàn mới (OWNER only)
 * POST /api/tables
 */
export const createTable = (shopId, data) =>
  axiosInstance.post(`shops/${shopId}/tables`, data);

/**
 * ✏️ Cập nhật thông tin bàn
 * PUT /api/tables/{id}
 */
export const updateTable = (id, shopId, data) =>
  axiosInstance.put(`shops/${shopId}/tables/${id}`, data);

/**
 * 🔄 Cập nhật trạng thái bàn
 * PUT /api/tables/{id}/status?status={status}
 */
export const updateTableStatus = (id, shopId, status) =>
  axiosInstance.put(`shops/${shopId}/tables/${id}/status`, null, {
    params: { status },
  });

/**
 * 🗑️ Xóa bàn (soft delete)
 * DELETE /api/tables/{id}
 */
export const deleteTable = (id, shopId) =>
  axiosInstance.delete(`shops/${shopId}/tables/${id}`);
