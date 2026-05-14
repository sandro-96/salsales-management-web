import { createContext } from "react";

export const STOREFRONT_STATUS = Object.freeze({
  LOADING: "LOADING",
  READY: "READY",
  DISABLED: "DISABLED",
  NOT_FOUND: "NOT_FOUND",
});

export const StorefrontShopContext = createContext({
  shop: null,
  status: STOREFRONT_STATUS.LOADING,
  reload: () => {},
});
