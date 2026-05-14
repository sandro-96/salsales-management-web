import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * True when `pathname` matches this nav target (same rules as admin sidebar).
 * @param {string} pathname
 * @param {string} to
 * @param {boolean} [end] - If true, only exact `to` matches (no child paths).
 */
export function isActiveNavPath(pathname, to, end = false) {
  if (!to || to === "#") return false;
  const base = to === "/" ? "/" : String(to).replace(/\/$/, "") || "/";
  if (end) return pathname === base;
  if (pathname === base) return true;
  if (base === "/") return false;
  return pathname.startsWith(`${base}/`);
}
