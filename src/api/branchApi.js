import axiosInstance from "./axiosInstance";
const BRANCH_API = "/branches";

function buildBranchFormData(data) {
  const { paymentQrFile, ...branch } = data || {};
  const formData = new FormData();
  formData.append(
    "branch",
    new Blob([JSON.stringify(branch)], { type: "application/json" }),
    "branch.json",
  );
  if (paymentQrFile) {
    formData.append(
      "paymentQrFile",
      paymentQrFile,
      paymentQrFile.name || "payment-qr.jpg",
    );
  }
  return formData;
}

/**
 * 🔗 Lấy thông tin chi nhánh theo slug
 * @param {string} slug
 */
export const getBranchBySlug = (slug, shopId) => {
  return axiosInstance.get(`${BRANCH_API}/by-slug/${slug}?shopId=${shopId}`);
};

export const createBranch = (shopId, data) =>
  axiosInstance.post(`${BRANCH_API}?shopId=${shopId}`, buildBranchFormData(data), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateBranch = (shopId, branchId, data) =>
  axiosInstance.put(
    `${BRANCH_API}/${branchId}?shopId=${shopId}`,
    buildBranchFormData(data),
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
