/** @param {Record<string, unknown> | null | undefined} p */
function effectivePriority(p) {
  const n = p?.priority;
  if (n == null || Number.isNaN(Number(n))) return 0;
  return Number(n);
}

/** @param {number} basePrice */
export function calcDiscountedPrice(basePrice, promo) {
  if (!promo) return basePrice;
  if (promo.discountType === "PERCENT") {
    return basePrice * (1 - promo.discountValue / 100);
  }
  return Math.max(0, basePrice - promo.discountValue);
}

function discountedUnitPrice(unitBeforePromo, promo) {
  return calcDiscountedPrice(unitBeforePromo, promo);
}

/**
 * Gom KM đang hiệu lực theo chi nhánh; map theo productId + danh sách toàn shop.
 * @returns {{ promoMap: Map<string, unknown[]>, activePromotions: unknown[] }}
 */
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

/** Các KM có thể áp cho một productId (theo map từ {@link buildPromotionMap}). */
export function collectApplicablePromotions(promoMap, productId) {
  const specific = promoMap.get(productId) || [];
  const shopWide = promoMap.get("__SHOP_WIDE__") || [];
  return [...specific, ...shopWide];
}

/**
 * Chọn một KM khi nhiều chương trình cùng thỏa điều kiện:
 * priority giảm dần → giá sau giảm thấp hơn (lợi hơn cho khách) → id tăng dần.
 *
 * @param {unknown[]} candidates
 * @param {number} baseUnitPrice giá đơn vị trước KM (đã gồm biến thể + topping nếu UI tính trước)
 */
export function selectWinningPromotion(candidates, baseUnitPrice) {
  if (!candidates?.length) return null;
  const base = Number(baseUnitPrice) || 0;
  const sorted = [...candidates].sort((a, b) => {
    const pd = effectivePriority(b) - effectivePriority(a);
    if (pd !== 0) return pd;
    const fa = discountedUnitPrice(base, a);
    const fb = discountedUnitPrice(base, b);
    if (fa !== fb) return fa - fb;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
  return sorted[0] ?? null;
}

/**
 * @param {Map<string, unknown[]>} promoMap
 * @param {string} productId
 * @param {number} baseUnitPrice
 */
export function getWinningPromo(promoMap, productId, baseUnitPrice) {
  return selectWinningPromotion(
    collectApplicablePromotions(promoMap, productId),
    baseUnitPrice,
  );
}

export function formatDiscount(promo) {
  if (!promo) return "";
  if (promo.discountType === "PERCENT") return `-${promo.discountValue}%`;
  return `-${Number(promo.discountValue).toLocaleString("vi-VN")}₫`;
}
