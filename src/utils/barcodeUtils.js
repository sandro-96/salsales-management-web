/**
 * Tra cứu thông tin sản phẩm từ mã vạch qua Open Food Facts API.
 * Chủ yếu cover hàng tiêu dùng đóng gói (FMCG). Hàng nội địa VN coverage thấp hơn.
 *
 * @param {string} barcode - EAN-13 / EAN-8 / UPC-A
 * @returns {Promise<{name, category, description, images} | null>}
 */
export async function lookupBarcode(barcode) {
  if (!barcode || !/^\d{6,14}$/.test(barcode)) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const name =
      p.product_name_vi || p.product_name || p.abbreviated_product_name || null;

    const category =
      p.categories_tags?.find((t) => t.startsWith("vi:"))?.replace("vi:", "") ||
      p.categories_tags?.find((t) => t.startsWith("en:"))?.replace("en:", "") ||
      null;

    const images = [];
    if (p.image_front_url) images.push(p.image_front_url);
    if (p.image_url && p.image_url !== p.image_front_url)
      images.push(p.image_url);

    const description = p.generic_name_vi || p.generic_name || null;

    // Return null if we couldn't get at least a name
    if (!name) return null;

    return {
      name: name.trim(),
      category: category ? capitalize(category.replace(/-/g, " ")) : null,
      description: description?.trim() || null,
      images: images.slice(0, 3), // at most 3 remote images (for reference only)
    };
  } catch {
    return null;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
