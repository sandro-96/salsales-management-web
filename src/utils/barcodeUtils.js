import { lookupProductByBarcode } from "@/api/productApi";
import { buildBarcodeLookupCandidates, normalizeBarcodeDigits } from "@/utils/gtinBarcode.js";

/**
 * Tra cứu thông tin sản phẩm từ mã vạch qua shared catalog nội bộ.
 * Thử nhiều biến thể (EAN-13 có số 0 đầu vs UPC-12) vì catalog/shop có thể lưu khác dạng quét.
 *
 * @param {string} barcode - EAN-13 / EAN-8 / UPC-A
 * @returns {Promise<{name, category, description, images} | null>}
 */
export async function lookupBarcode(barcode) {
  const normalized = normalizeBarcodeDigits(barcode);
  if (!normalized || !/^\d{6,14}$/.test(normalized)) return null;
  const candidates = buildBarcodeLookupCandidates(normalized);
  for (const c of candidates) {
    if (!/^\d{6,14}$/.test(c)) continue;
    try {
      const res = await lookupProductByBarcode(c);
      const data = res.data?.data;
      if (data?.name) {
        return {
          name: data.name,
          category:
            typeof data.category === "string"
              ? data.category.toLowerCase()
              : (data.category ?? null),
          description: data.description ?? null,
          images: data.images ?? [],
        };
      }
    } catch {
      /* thử candidate tiếp */
    }
  }
  return null;
}
