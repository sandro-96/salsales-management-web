import axiosInstance from "./axiosInstance";

/**
 * 📦 Lấy danh sách sản phẩm (phân trang, lọc cơ bản — KHÔNG hỗ trợ keyword search)
 * GET /api/shops/{shopId}/products
 * params: { category, active, minPrice, maxPrice, page, size, sortBy, sortDir, branchIds[] }
 * Dùng khi không cần tìm kiếm theo keyword (VD: load list sơ bộ, dropdown chọn sản phẩm...)
 */
/** Thống kê SP cấp shop: total / active / inactive. */
export const getProductSummary = (shopId, params = {}) =>
  axiosInstance.get(`/shops/${shopId}/products/summary`, { params });

export const getProducts = (shopId, params = {}) =>
  axiosInstance.get(`/shops/${shopId}/products`, {
    params,
    paramsSerializer: (p) => {
      const sp = new URLSearchParams();
      Object.entries(p).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => sp.append(key, v));
        } else if (val !== undefined && val !== null) {
          sp.append(key, val);
        }
      });
      return sp.toString();
    },
  });

/**
 * 🔍 Tìm kiếm sản phẩm — hỗ trợ keyword (name/SKU/barcode) + filter nâng cao
 * GET /api/shops/{shopId}/products/search
 * params: { keyword, category, active, minPrice, maxPrice, branchId, page, size, sortBy, sortDir }
 * Dùng cho ProductPage và mọi màn hình có ô tìm kiếm.
 */
export const searchProducts = (shopId, params = {}) =>
  axiosInstance.get(`/shops/${shopId}/products/search`, {
    params,
    paramsSerializer: (p) => {
      const sp = new URLSearchParams();
      Object.entries(p).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => sp.append(key, v));
        } else if (val !== undefined && val !== null) {
          sp.append(key, val);
        }
      });
      return sp.toString();
    },
  });

/**
 * 📦 Lấy danh sách sản phẩm theo chi nhánh cụ thể
 * GET /api/shops/{shopId}/branches/{branchId}/products
 * params: { keyword, page, size, sortBy, sortDir }
 * Hỗ trợ keyword tìm theo tên/SKU/barcode (cập nhật 16/03/2026)
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
 * ➕ Tạo sản phẩm mới từ shop (multipart/form-data)
 * POST /api/shops/{shopId}/products
 * @param {string}   shopId
 * @param {Object}   data   - ProductRequest (JSON)
 * @param {File[]}   files  - Ảnh đính kèm (tối đa 10)
 */
export const createProduct = (shopId, data, files = []) => {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
    "product.json",
  );
  files.forEach((file, index) =>
    formData.append("files", file, file?.name || `product-image-${index + 1}.jpg`),
  );

  return axiosInstance.post(`/shops/${shopId}/products`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Upload ảnh biến thể (staging) — trả về URL để gắn vào variants[].images
 * POST /api/shops/{shopId}/products/variant-images/staged
 */
export const uploadStagedVariantImages = (shopId, files = []) => {
  const formData = new FormData();
  files.forEach((file, index) =>
    formData.append("files", file, file?.name || `variant-image-${index + 1}.jpg`),
  );
  return axiosInstance.post(
    `/shops/${shopId}/products/variant-images/staged`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

/**
 * ➕ Tạo sản phẩm từ chi nhánh
 * POST /api/shops/{shopId}/branches/{branchId}/products
 */
export const createBranchProduct = (shopId, branchId, data) =>
  axiosInstance.post(`/shops/${shopId}/branches/${branchId}/products`, data);

/**
 * ✏️ Cập nhật sản phẩm (id = BranchProduct ID)
 * PUT /api/shops/{shopId}/products/{id}
 * @param {string}   shopId
 * @param {string}   id     - BranchProduct ID
 * @param {Object}   data   - ProductRequest (JSON)
 * @param {File[]}   files  - Ảnh mới muốn thêm vào
 * Note: data.images phải chứa các URL ảnh cũ muốn giữ lại; ảnh không có trong list sẽ bị xóa khỏi S3
 */
export const updateProduct = (shopId, id, data, files = []) => {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
    "product.json",
  );
  files.forEach((file, index) =>
    formData.append("files", file, file?.name || `product-image-${index + 1}.jpg`),
  );

  return axiosInstance.put(`/shops/${shopId}/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * ✏️ Cập nhật BranchProduct (giá, tồn kho, trạng thái theo chi nhánh)
 * PUT /api/shops/{shopId}/branches/{branchId}/products/{id}
 * @param {string} shopId
 * @param {string} branchId
 * @param {string} id       - BranchProduct ID
 * @param {Object} data     - { price, branchCostPrice, discountPrice, discountPercentage, quantity, minQuantity, expiryDate, activeInBranch }
 */
export const updateBranchProduct = (shopId, branchId, id, data) =>
  axiosInstance.put(
    `/shops/${shopId}/branches/${branchId}/products/${id}`,
    data,
  );

/**
 * 🗑️ Xóa sản phẩm (id = BranchProduct ID)
 * DELETE /api/shops/{shopId}/branches/{branchId}/products/{id}
 */
export const deleteProduct = (shopId, id) =>
  axiosInstance.delete(`/shops/${shopId}/products/${id}`);

/**
 * 🔄 Bật/tắt trạng thái active
 * PATCH /api/shops/{shopId}/products/{productId}/toggle-active
 */
export const toggleProductActive = (shopId, productId) =>
  axiosInstance.patch(`/shops/${shopId}/products/${productId}/toggle`);

/**
 * 🔄 Bật/tắt theo dõi tồn kho (theo sản phẩm)
 * PATCH /api/shops/{shopId}/products/{productId}/track-inventory
 * body: { trackInventory: boolean }
 */
export const updateProductTrackInventory = (
  shopId,
  productId,
  trackInventory,
) =>
  axiosInstance.patch(
    `/shops/${shopId}/products/${productId}/toggle-track-inventory`,
    { trackInventory },
  );

/**
 * 🔄 Bật/tắt trạng thái activeInBranch
 * PATCH /api/shops/{shopId}/branches/{branchId}/products/{branchProductId}/toggle-active
 */
export const toggleProductActiveInBranch = (
  shopId,
  branchId,
  branchProductId,
) =>
  axiosInstance.patch(
    `/shops/${shopId}/branches/${branchId}/products/${branchProductId}/toggle`,
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

/**
 * 📥 Xuất sản phẩm ra file Excel
 * GET /api/products/import-export/export
 * @param {string}      shopId
 * @param {string|null} branchId - Nếu null: xuất cấp shop (cột chi nhánh trống)
 */
export const exportProductsExcel = (shopId, branchId = null) => {
  const params = { shopId };
  if (branchId) params.branchId = branchId;
  return axiosInstance.get("/products/import-export/export", {
    params,
    responseType: "blob",
  });
};

/**
 * 📤 Nhập sản phẩm từ file Excel
 * POST /api/products/import-export/import
 * @param {string} shopId
 * @param {File}   file
 */
export const importProductsExcel = (shopId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosInstance.post("/products/import-export/import", formData, {
    params: { shopId },
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Tra cứu thông tin sản phẩm từ catalog chuẩn (do system admin duy trì) theo mã vạch.
 * GET /api/catalog/barcode/{barcode}
 *
 * @param {string} barcode - EAN-13 / EAN-8 / UPC-A
 * @returns {Promise<AxiosResponse<{success: boolean, data: {name, category, description, images}}>>}
 */
export const lookupProductByBarcode = (barcode) =>
  axiosInstance.get(`/catalog/barcode/${encodeURIComponent(barcode)}`);

/**
 * Tìm kiếm catalog chuẩn (system) theo tên — substring, không phân biệt hoa thường.
 * GET /api/catalog/search?keyword=&size=
 */
export const searchProductCatalog = (keyword, params = {}) =>
  axiosInstance.get("/catalog/search", {
    params: { keyword, size: params.size ?? 8 },
  });
