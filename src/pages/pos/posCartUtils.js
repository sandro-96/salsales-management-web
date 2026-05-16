export function cartFromOrderItems(items, t) {
  const fallback =
    typeof t === "function"
      ? t("pages.pos.cartUtils.productFallback")
      : "Product";
  const list = Array.isArray(items) ? items : [];
  return list.map((it, idx) => {
    const unit = it?.priceAfterDiscount ?? it?.price ?? 0;
    const base = it?.price ?? unit;
    const hasDiscount = base != null && unit < base;
    const label = it?.variantName ? ` — ${it.variantName}` : "";
    const tops = Array.isArray(it.toppings) ? it.toppings : [];
    const toppingIds = tops
      .map((t) => t?.toppingId)
      .filter(Boolean)
      .map((id) => String(id).trim())
      .sort((a, b) => a.localeCompare(b));
    const toppingLabel =
      tops.length > 0
        ? tops
            .map((t) => t?.name || t?.toppingId)
            .filter(Boolean)
            .join(", ")
        : "";
    const nameExtra =
      toppingLabel && tops.length > 0 ? ` + ${toppingLabel}` : "";
    const name = `${it?.productName || fallback}${label}${nameExtra}`;
    const productId = it?.productId || "";
    const variantId = it?.variantId || null;
    const tKey = toppingIds.length ? toppingIds.join(",") : "not";
    const lineKey = variantId
      ? `${productId}__${variantId}__t:${tKey}`
      : `${productId}__t:${tKey}__i:${idx}`;
    const sellByWeight = !!it?.sellByWeight;
    return {
      lineKey,
      productId,
      variantId,
      toppingIds,
      productName: name,
      originalPrice: base,
      price: unit,
      hasDiscount,
      promoLabel: it?.promotionDiscountLabel || null,
      quantity: it?.quantity ?? 0,
      trackInventory: null,
      maxStock: null,
      sellByWeight,
      weight: sellByWeight ? (it?.weight ?? null) : null,
      weightUnit: sellByWeight ? (it?.weightUnit ?? null) : null,
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
