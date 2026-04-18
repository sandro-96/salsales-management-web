/**
 * Hiển thị dòng biến thể trên đơn / hóa đơn (đồng bộ OrderList + PosInvoiceReceipt).
 */
export function orderLineVariantLabel(item) {
  const name = item?.variantName;
  if (name && String(name).trim()) {
    const t = String(name).trim();
    if (t.startsWith("Biến thể")) return t;
    return `${t}`;
  }
  const vid = item?.variantId;
  if (!vid || !String(vid).trim()) return null;
  const id = String(vid).trim();
  const short = id.length > 10 ? id.slice(-8).toUpperCase() : id;
  return `${short}`;
}

/** Thuộc tính từ API (làm giàu từ catalog khi xem đơn). */
export function orderLineAttributesLabel(item) {
  const t = item?.variantAttributesText?.trim?.();
  return t || null;
}

export function orderLineToppings(item) {
  const tops = item?.toppings;
  return Array.isArray(tops) ? tops : [];
}
