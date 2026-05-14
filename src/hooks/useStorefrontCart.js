import { useContext } from "react";
import { StorefrontCartContext } from "../contexts/storefrontCartContext.js";

export function useStorefrontCart() {
  const ctx = useContext(StorefrontCartContext);
  if (!ctx) {
    throw new Error(
      "useStorefrontCart must be used inside <StorefrontCartProvider>",
    );
  }
  return ctx;
}
