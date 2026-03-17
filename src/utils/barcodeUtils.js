import { lookupProductByBarcode } from "@/api/productApi";

/**
 * Tra cứu thông tin sản phẩm từ mã vạch qua shared catalog nội bộ.
 * Catalog được xây dựng từ dữ liệu crowdsourced của các shop trong hệ thống.
 *
 * @param {string} barcode - EAN-13 / EAN-8 / UPC-A
 * @returns {Promise<{name, category, description, images} | null>}
 */
export async function lookupBarcode(barcode) {
  if (!barcode || !/^\d{6,14}$/.test(barcode)) return null;
  try {
    const res = await lookupProductByBarcode(barcode);
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
    return null;
  } catch {
    return null;
  }
}
