import axios from "axios";

/**
 * Axios riêng cho QR self-ordering tại bàn — guest user, không cần auth.
 *
 * - KHÔNG gắn Authorization / X-Shop-Id.
 * - KHÔNG có interceptor refresh token.
 * - Endpoint `/api/storefront/tables/*` đã được backend whitelist permitAll.
 */
const tableOrderingAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const unwrap = (res) => {
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

const encodeToken = (token) => encodeURIComponent(token);

export const getTableContext = (qrToken) =>
  tableOrderingAxios
    .get(`/storefront/tables/${encodeToken(qrToken)}`)
    .then(unwrap);

export const getTableCategories = (qrToken) =>
  tableOrderingAxios
    .get(`/storefront/tables/${encodeToken(qrToken)}/categories`)
    .then(unwrap);

export const getTableProducts = (
  qrToken,
  { q, category, page = 0, size = 24, sort } = {},
) => {
  const params = { page, size };
  if (q) params.q = q;
  if (category) params.category = category;
  if (sort) params.sort = sort;
  return tableOrderingAxios
    .get(`/storefront/tables/${encodeToken(qrToken)}/products`, { params })
    .then(unwrap);
};

export const getTableProductDetail = (qrToken, productId) =>
  tableOrderingAxios
    .get(
      `/storefront/tables/${encodeToken(qrToken)}/products/${encodeURIComponent(productId)}`,
    )
    .then(unwrap);

export const getTableCurrentOrder = (qrToken) =>
  tableOrderingAxios
    .get(`/storefront/tables/${encodeToken(qrToken)}/current-order`)
    .then(unwrap);

export const placeTableOrder = (qrToken, payload) =>
  tableOrderingAxios
    .post(`/storefront/tables/${encodeToken(qrToken)}/orders`, payload)
    .then(unwrap);

export default tableOrderingAxios;
