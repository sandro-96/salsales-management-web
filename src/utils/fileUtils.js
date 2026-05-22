import {
  isProductImageFile,
  prepareProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
} from "./productImageFiles.js";

export { PRODUCT_IMAGE_ACCEPT };

/**
 * Chọn một ảnh (avatar, logo…) — tương thích mobile (HEIC, type rỗng).
 */
export const handleFileChange = async ({
  event,
  setError,
  setFile,
  setPreview,
  onReject,
}) => {
  const selectedFile = event.target.files?.[0];
  event.target.value = "";
  if (!selectedFile) return;

  if (!isProductImageFile(selectedFile)) {
    const msg = "Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP, HEIC…).";
    setError?.(msg);
    onReject?.(msg);
    setFile?.(null);
    setPreview?.(null);
    return;
  }

  try {
    const processed = await prepareProductImageFile(selectedFile);
    setFile?.(processed);
    setPreview?.(URL.createObjectURL(processed));
    setError?.("");
  } catch (err) {
    console.warn("handleFileChange failed", err);
    const msg = "Không xử lý được ảnh. Vui lòng chọn ảnh khác.";
    setError?.(msg);
    onReject?.(msg);
    setFile?.(null);
    setPreview?.(null);
  }
};
