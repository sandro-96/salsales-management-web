import axiosInstance from "./axiosInstance";

/**
 * 📦 Lấy danh sách sản phẩm theo shopId (ProductSearchRequest)
 * GET /api/shops/{shopId}/products
 * params: { keyword, category, active, minPrice, maxPrice, page, size, sortBy, sortDir, branchId }
 */
export const getProducts = (shopId, params = {}) =>
  axiosInstance.get(`/shops/${shopId}/products`, { params });

/**
 * 📦 Lấy danh sách sản phẩm theo chi nhánh cụ thể
 * GET /api/shops/{shopId}/branches/{branchId}/products
 */
export const getBranchProducts = (shopId, branchId, params = {}) =>
  axiosInstance.get(`/shops/${shopId}/branches/${branchId}/products`, {
    params,
  });

/**
 * 📦 Lấy chi tiết sản phẩm (BranchProduct) theo ID
 * GET /api/shops/{shopId}/branches/{branchId}/products/{id}
 */
export const getProductById = (shopId, branchId, id) =>
  axiosInstance.get(`/shops/${shopId}/branches/${branchId}/products/${id}`);

/**
 * ➕ Tạo sản phẩm mới từ shop (JSON body, không phải multipart)
 * POST /api/shops/{shopId}/products?branchIds=...
 * @param {string}   shopId
 * @param {Object}   data      - ProductRequest (JSON)
 * @param {string[]} branchIds - Danh sách branchId tùy chọn
 */
export const createProduct = (shopId, data, branchIds = []) =>
  axiosInstance.post(`/shops/${shopId}/products`, data, {
    params: branchIds.length ? { branchIds } : {},
  });

/**
 * ➕ Tạo sản phẩm từ chi nhánh
 * POST /api/shops/{shopId}/branches/{branchId}/products
 */
export const createBranchProduct = (shopId, branchId, data) =>
  axiosInstance.post(`/shops/${shopId}/branches/${branchId}/products`, data);

/**
 * ✏️ Cập nhật sản phẩm (id = BranchProduct ID)
 * PUT /api/shops/{shopId}/products/{id}?branchIds=...
 * @param {string}   shopId
 * @param {string}   id        - BranchProduct ID
 * @param {Object}   data      - ProductRequest (JSON)
 * @param {string[]} branchIds - Chi nhánh cần cập nhật (tùy chọn)
 */
export const updateProduct = (shopId, id, data, branchIds = []) =>
  axiosInstance.put(`/shops/${shopId}/products/${id}`, data, {
    params: branchIds.length ? { branchIds } : {},
  });

/**
 * 🗑️ Xóa sản phẩm (id = BranchProduct ID)
 * DELETE /api/shops/{shopId}/branches/{branchId}/products/{id}
 */
export const deleteProduct = (shopId, branchId, id) =>
  axiosInstance.delete(`/shops/${shopId}/branches/${branchId}/products/${id}`);

/**
 * 🔄 Bật/tắt trạng thái activeInBranch
 * PATCH /api/shops/{shopId}/branches/{branchId}/products/{branchProductId}/toggle-active
 */
export const toggleProductActive = (shopId, branchId, branchProductId) =>
  axiosInstance.patch(
    `/shops/${shopId}/branches/${branchId}/products/${branchProductId}/toggle-active`,
  );

/**
 * ⚠️ Lấy danh sách sản phẩm tồn kho thấp
 * GET /api/products/status/shops/{shopId}/low-stock
 */
export const getLowStockProducts = (shopId, branchId, threshold = 10) =>
  axiosInstance.get(`/products/status/shops/${shopId}/low-stock`, {
    params: { branchId, threshold },
  });

/**
 * 🏷️ Gợi ý mã SKU
 * GET /api/shops/{shopId}/products/suggested-sku
 */
export const getSuggestedSku = (shopId, industry, category) =>
  axiosInstance.get(`/shops/${shopId}/suggested-sku`, {
    params: { industry, category },
  });

/**
 * 🏷️ Gợi ý Barcode (EAN-13, prefix GS1 Việt Nam 893)
 * GET /api/shops/{shopId}/products/suggested-barcode
 */
export const getSuggestedBarcode = (shopId, industry, category) =>
  axiosInstance.get(`/shops/${shopId}/suggested-barcode`, {
    params: { industry, category },
  });
