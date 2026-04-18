import axiosInstance from "./axiosInstance";

const SHOP_API = "/shop";

/**
 * 🏪 Tạo cửa hàng mới
 * @param {FormData} formData - gồm { shop: JSON string, file: optional }
 */
export const createShop = (formData) => {
  return axiosInstance.post(`${SHOP_API}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * 🏪 Lấy thông tin cửa hàng theo ID
 * @param {string} shopId
 */
export const getShopById = (shopId) => {
  return axiosInstance.get(`${SHOP_API}/${shopId}`);
};

/**
 * ✏️ Cập nhật cửa hàng theo ID
 * @param {string} shopId
 * @param {FormData} formData - gồm { shop: JSON string, file: optional }
 */
export const updateShopById = (shopId, formData) => {
  return axiosInstance.put(`${SHOP_API}/${shopId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * 🧾 Lấy danh sách cửa hàng của người dùng hiện tại (phân trang)
 * @param {Object} params - { page, size, sort }
 */
export const getMyShops = (params) => {
  return axiosInstance.get(`${SHOP_API}/my`, { params });
};

/**
 * 🗑️ Xóa cửa hàng theo ID
 * @param {string} shopId
 */
export const deleteShop = (shopId) => {
  return axiosInstance.delete(`${SHOP_API}/${shopId}`);
};

/**
 * 🔗 Lấy thông tin cửa hàng theo slug
 * @param {string} slug
 */
export const getShopBySlug = (slug) => {
  return axiosInstance.get(`${SHOP_API}/by-slug/${slug}`);
};

/** Danh mục topping dùng chung của shop */
export const getShopToppings = (shopId) => {
  return axiosInstance.get(`${SHOP_API}/${shopId}/toppings`);
};

/** Thay toàn bộ danh mục topping shop */
export const putShopToppings = (shopId, toppings) => {
  return axiosInstance.put(`${SHOP_API}/${shopId}/toppings`, toppings);
};
