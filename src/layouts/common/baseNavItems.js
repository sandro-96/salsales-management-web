// src/layouts/common/baseNavItems.js
import {
  FaHome, FaHistory, FaShoppingCart,
} from "react-icons/fa";

export const commonWebNav = {
  user: [
    { to: "/main", icon: FaHome, labelKey: "nav.home" },
    { to: "/orders", icon: FaShoppingCart, labelKey: "nav.orders" },
    { to: "/history", icon: FaHistory, labelKey: "nav.history" },
  ],
};
