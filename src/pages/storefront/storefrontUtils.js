/**
 * Tiện ích nhỏ chỉ dùng cho storefront công khai.
 * Không phụ thuộc theme/admin utils để tránh kéo dependency không cần thiết.
 */

export function formatCurrency(value, currency = "VND", localeTag = "vi-VN") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  try {
    return new Intl.NumberFormat(localeTag || "vi-VN", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString(localeTag || "vi-VN")} ${currency || "VND"}`;
  }
}

export function pickProductImage(product) {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      if (Array.isArray(v.images) && v.images.length > 0) return v.images[0];
    }
  }
  return null;
}

export function pickVariantImage(variant, fallbackProduct) {
  if (Array.isArray(variant?.images) && variant.images.length > 0) {
    return variant.images[0];
  }
  return pickProductImage(fallbackProduct);
}

/** Danh sách URL gallery: ưu tiên ảnh biến thể đang chọn, không thì ảnh sản phẩm. */
export function collectGalleryImages(product, variant = null) {
  if (Array.isArray(variant?.images) && variant.images.length > 0) {
    return variant.images.filter(Boolean);
  }
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }
  return [];
}
