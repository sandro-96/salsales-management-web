import { createContext } from "react";

/**
 * Context cho giỏ hàng của storefront. Provider quản lý state + persist localStorage.
 * Export tách rời để hỗ trợ react-refresh (fast refresh chỉ thích export component).
 */
export const StorefrontCartContext = createContext(null);
