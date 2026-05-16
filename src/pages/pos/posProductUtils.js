/** Hết tồn (không thêm được) — dùng hiển thị trên lưới POS. */
export function isProductOutOfStock(product) {
  if (!product || product.trackInventory === false) return false;
  if (product.sellByWeight) {
    return (product.stockInBaseUnits ?? 0) <= 0;
  }
  if (hasBranchVariants(product)) {
    return (product.branchVariants ?? []).every((v) => (v.quantity ?? 0) < 1);
  }
  return (product.quantity ?? 0) < 1;
}

export function hasBranchVariants(product) {
  return (
    Array.isArray(product?.branchVariants) && product.branchVariants.length > 0
  );
}

export function variantCatalogName(product, variantId) {
  const v = (product?.variants || []).find((x) => x.variantId === variantId);
  return v?.name || variantId || "";
}

/** Topping đang bật trên master product (POS catalog) — từ {@code applicableToppings} API */
export function activeToppings(product) {
  if (product?.toppingsEnabled === false) {
    return [];
  }
  const list = product?.applicableToppings ?? product?.toppings;
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.filter((t) => t && t.toppingId && t.active !== false);
}

export function normalizeToppingIdList(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function toppingExtrasForSelection(product, toppingIds) {
  const norm = normalizeToppingIdList(toppingIds);
  if (norm.length === 0) return 0;
  const defs = activeToppings(product);
  const byId = new Map(defs.map((t) => [String(t.toppingId).trim(), t]));
  let sum = 0;
  for (const id of norm) {
    const t = byId.get(id);
    if (t) sum += Number(t.extraPrice ?? 0);
  }
  return sum;
}

export function formatToppingSelectionLabel(product, toppingIds) {
  const norm = normalizeToppingIdList(toppingIds);
  if (norm.length === 0) return "";
  const defs = activeToppings(product);
  const byId = new Map(defs.map((t) => [String(t.toppingId).trim(), t]));
  return norm
    .map((id) => byId.get(id)?.name || id)
    .filter(Boolean)
    .join(", ");
}
