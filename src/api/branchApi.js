import axiosInstance from "./axiosInstance";
const BRANCH_API = "/branches";

/**
 * 🔗 Lấy thông tin chi nhánh theo slug
 * @param {string} slug
 */
export const getBranchBySlug = (slug, shopId) => {
  return axiosInstance.get(`${BRANCH_API}/by-slug/${slug}?shopId=${shopId}`);
};
