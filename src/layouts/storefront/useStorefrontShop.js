import { useContext } from "react";
import { StorefrontShopContext } from "./storefrontShopContext.js";

export function useStorefrontShop() {
  return useContext(StorefrontShopContext);
}
