import axios from "axios";

/**
 * Axios instance riêng cho storefront công khai (guest user, không cần auth).
 *
 * - KHÔNG gắn Authorization / X-Shop-Id.
 * - KHÔNG có interceptor refresh token (tránh redirect về /login khi gặp 401/403).
 * - Endpoint nằm dưới `/api/storefront/*` đã được backend whitelist permitAll.
 */
const storefrontAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const unwrap = (res) => {
  // Backend trả về `ApiResponseDto<T>` dạng { success, code, message, data, timestamp }.
  // Khi success === false vẫn là HTTP 200 ở một số endpoint — convert sang reject.
  const body = res?.data;
  if (body && Object.prototype.hasOwnProperty.call(body, "success")) {
    if (body.success === false) {
      const err = new Error(body.message || "Yêu cầu thất bại");
      err.code = body.code;
      err.payload = body;
      throw err;
    }
    return body.data;
  }
  return body;
};

export const getStorefrontShop = (slug) =>
  storefrontAxios.get(`/storefront/shops/${encodeURIComponent(slug)}`).then(unwrap);

export const getStorefrontCategories = (slug) =>
  storefrontAxios
    .get(`/storefront/shops/${encodeURIComponent(slug)}/categories`)
    .then(unwrap);

export const getStorefrontProducts = (slug, { q, category, page = 0, size = 24, sort } = {}) => {
  const params = { page, size };
  if (q) params.q = q;
  if (category) params.category = category;
  if (sort) params.sort = sort;
  return storefrontAxios
    .get(`/storefront/shops/${encodeURIComponent(slug)}/products`, { params })
    .then(unwrap);
};

export const getStorefrontProductDetail = (slug, productId) =>
  storefrontAxios
    .get(
      `/storefront/shops/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
    )
    .then(unwrap);

export const createStorefrontOrder = (slug, payload) =>
  storefrontAxios
    .post(`/storefront/shops/${encodeURIComponent(slug)}/orders`, payload)
    .then(unwrap);

export default storefrontAxios;
