/** URL Quản lý đơn hàng với tab online & lọc chi nhánh (nếu có). */
export function buildOrdersListUrl({ branchId, source = "ONLINE", orderId } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (branchId) params.set("branchId", branchId);
  if (orderId) params.set("orderId", orderId);
  const q = params.toString();
  return q ? `/orders?${q}` : "/orders";
}
