/** Thứ tự nhóm menu sidebar (bán hàng → kho → người → vận hành). */
export const NAV_SECTION_ORDER = [
  "sales",
  "catalog",
  "people",
  "business",
  "other",
];

const PATH_TO_SECTION = {
  "/pos": "sales",
  "/overview": "sales",
  "/orders": "sales",
  "/tables": "sales",
  "/products": "catalog",
  "/inventory": "catalog",
  "/promotions": "catalog",
  "/customers": "people",
  "/staffs": "people",
  "/branches": "business",
  "/reports": "business",
  "/settings": "other",
};

export function getNavSection(to) {
  if (!to) return "other";
  return PATH_TO_SECTION[to] || "other";
}

/**
 * Gom nav items theo section, giữ thứ tự gốc trong từng nhóm.
 * @returns {{ section: string, items: object[] }[]}
 */
export function groupNavItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const buckets = new Map();
  for (const item of items) {
    const section = item.section || getNavSection(item.to);
    if (!buckets.has(section)) buckets.set(section, []);
    buckets.get(section).push(item);
  }

  return NAV_SECTION_ORDER.filter(
    (key) => buckets.has(key) && buckets.get(key).length > 0,
  ).map((section) => ({ section, items: buckets.get(section) }));
}
