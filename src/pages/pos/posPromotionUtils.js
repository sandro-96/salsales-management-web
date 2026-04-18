export function buildPromotionMap(promotions, branchId) {
  const now = new Date();
  const active = promotions.filter((p) => {
    if (!p.active) return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    if (p.branchId && p.branchId !== branchId) return false;
    return true;
  });

  const map = new Map();
  for (const promo of active) {
    const ids = promo.applicableProductIds;
    if (!ids || ids.length === 0) {
      map.set("__SHOP_WIDE__", [...(map.get("__SHOP_WIDE__") || []), promo]);
    } else {
      for (const pid of ids) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(promo);
      }
    }
  }
  return { promoMap: map, activePromotions: active };
}

export function getBestPromo(promoMap, productId) {
  const specific = promoMap.get(productId) || [];
  const shopWide = promoMap.get("__SHOP_WIDE__") || [];
  const all = [...specific, ...shopWide];
  if (all.length === 0) return null;
  return all[0];
}

export function calcDiscountedPrice(basePrice, promo) {
  if (!promo) return basePrice;
  if (promo.discountType === "PERCENT") {
    return basePrice * (1 - promo.discountValue / 100);
  }
  return Math.max(0, basePrice - promo.discountValue);
}

export function formatDiscount(promo) {
  if (!promo) return "";
  if (promo.discountType === "PERCENT") return `-${promo.discountValue}%`;
  return `-${promo.discountValue.toLocaleString("vi-VN")}₫`;
}
