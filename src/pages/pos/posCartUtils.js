export function cartFromOrderItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((it, idx) => {
    const unit = it?.priceAfterDiscount ?? it?.price ?? 0;
    const base = it?.price ?? unit;
    const hasDiscount = base != null && unit < base;
    const label = it?.variantName ? ` — ${it.variantName}` : "";
    const name = `${it?.productName || "Sản phẩm"}${label}`;
    const productId = it?.productId || "";
    const variantId = it?.variantId || null;
    return {
      lineKey: variantId
        ? `${productId}__${variantId}`
        : `${productId}__${idx}`,
      productId,
      variantId,
      productName: name,
      originalPrice: base,
      price: unit,
      hasDiscount,
      promoLabel: it?.promotionDiscountLabel || null,
      quantity: it?.quantity ?? 0,
      trackInventory: null,
      maxStock: null,
    };
  });
}

export function createEmptyTab(id) {
  return {
    id,
    orderId: null,
    displayOrderCode: null,
    cart: [],
    tableId: "",
    note: "",
    customer: null,
    guestName: "",
    guestPhone: "",
    pointsToRedeem: 0,
  };
}
