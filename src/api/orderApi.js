import axiosInstance from "./axiosInstance";

/**
 * 📋 Lấy danh sách đơn hàng (phân trang)
 * GET /api/orders?shopId={shopId}
 */
export const getOrders = (shopId, params = {}) =>
  axiosInstance.get("/orders", { params: { shopId, ...params } });

/**
 * 🔍 Lọc đơn hàng theo trạng thái
 * GET /api/orders/filter?shopId={shopId}&status={status}
 */
export const filterOrders = (shopId, status, params = {}) =>
  axiosInstance.get("/orders/filter", {
    params: { shopId, status, ...params },
  });

/**
 * 📊 Xem trước thuế (theo chính sách thuế hiện tại)
 * GET /api/orders/preview-tax?shopId=&branchId=&totalPrice=
 */
export const previewOrderTax = (shopId, branchId, totalPrice) =>
  axiosInstance.get("/orders/preview-tax", {
    params: { shopId, branchId, totalPrice },
  });

/**
 * ➕ Tạo đơn hàng mới
 * POST /api/orders?shopId={shopId}&branchId={branchId}
 */
export const createOrder = (shopId, branchId, data) =>
  axiosInstance.post("/orders", data, { params: { shopId, branchId } });

/**
 * ✏️ Cập nhật đơn hàng
 * PUT /api/orders/{id}?shopId={shopId}
 */
export const updateOrder = (id, shopId, data) =>
  axiosInstance.put(`/orders/${id}`, data, { params: { shopId } });

/**
 * Cập nhật giao hàng / tham chiếu / ghi chú / khách — cho phép cả đơn đã thanh toán
 * PATCH /api/orders/{id}/fulfillment?shopId=
 */
export const patchOrderFulfillment = (id, shopId, data) =>
  axiosInstance.patch(`/orders/${id}/fulfillment`, data, { params: { shopId } });

/**
 * ❌ Hủy đơn hàng
 * PUT /api/orders/{id}/cancel?shopId={shopId}
 */
export const cancelOrder = (id, shopId) =>
  axiosInstance.put(`/orders/${id}/cancel`, null, { params: { shopId } });

/**
 * 💳 Xác nhận thanh toán
 * POST /api/orders/{orderId}/confirm-payment?shopId={shopId}&paymentId={paymentId}&paymentMethod={paymentMethod}
 */
export const confirmPayment = (orderId, shopId, paymentId, paymentMethod) =>
  axiosInstance.post(`/orders/${orderId}/confirm-payment`, null, {
    params: { shopId, paymentId, paymentMethod },
  });

/**
 * 🔄 Cập nhật trạng thái đơn hàng
 * PUT /api/orders/{id}/status?shopId={shopId}&status={status}
 */
export const updateOrderStatus = (id, shopId, status) =>
  axiosInstance.put(`/orders/${id}/status`, null, {
    params: { shopId, status },
  });
