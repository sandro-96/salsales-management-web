/** Canonical site origin — set VITE_SITE_URL when deploying (e.g. https://sothuchi.vn). */
export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!base) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
