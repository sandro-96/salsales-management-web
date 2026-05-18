/** Routes allowed when user has no shop (onboarding). */
const ZERO_SHOP_EXACT = new Set([
  "/main",
  "/shops",
  "/shops/create",
  "/contact",
  "/support",
  "/accounts",
  "/history",
  "/notifications",
  "/billing",
]);

const ZERO_SHOP_PREFIXES = ["/shops/"];

export function isZeroShopAllowedPath(pathname) {
  if (!pathname) return false;
  if (ZERO_SHOP_EXACT.has(pathname)) return true;
  return ZERO_SHOP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
