import { isValidElement, createElement } from "react";

/**
 * Nav items often use Lucide icons (forwardRef), not plain functions.
 * Rendering the component reference as a child throws; use createElement.
 */
export function renderNavIcon(icon) {
  if (icon == null) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon);
}
