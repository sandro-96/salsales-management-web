import { useCallback, useEffect, useMemo, useState } from "react";
import { StorefrontCartContext } from "./storefrontCartContext.js";

const STORAGE_PREFIX = "storefront_cart_";

const cartKey = (slug) => `${STORAGE_PREFIX}${slug || "_default"}`;

const readCart = (slug) => {
  try {
    const raw = localStorage.getItem(cartKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && item.productId && item.quantity > 0,
    );
  } catch {
    return [];
  }
};

const writeCart = (slug, items) => {
  try {
    localStorage.setItem(cartKey(slug), JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
};

const sameLine = (a, b) =>
  a.productId === b.productId && (a.variantId || null) === (b.variantId || null);

/**
 * Storefront cart state: scoped theo `slug` của shop và lưu xuống localStorage.
 * Mỗi shop có một giỏ riêng để khách có thể đặt nhiều shop song song.
 */
export default function StorefrontCartProvider({ slug, children }) {
  const [items, setItems] = useState(() => readCart(slug));

  useEffect(() => {
    setItems(readCart(slug));
  }, [slug]);

  useEffect(() => {
    writeCart(slug, items);
  }, [slug, items]);

  const addItem = useCallback((line) => {
    if (!line || !line.productId || !(line.quantity > 0)) return;
    setItems((prev) => {
      const idx = prev.findIndex((p) => sameLine(p, line));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + line.quantity,
        };
        return next;
      }
      return [...prev, { ...line }];
    });
  }, []);

  const updateQuantity = useCallback((productId, variantId, quantity) => {
    setItems((prev) =>
      prev
        .map((p) =>
          sameLine(p, { productId, variantId })
            ? { ...p, quantity: Math.max(1, Number(quantity) || 1) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId, variantId) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, { productId, variantId })));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
    const totalAmount = items.reduce(
      (acc, i) => acc + (i.price || 0) * i.quantity,
      0,
    );
    return { totalQuantity, totalAmount };
  }, [items]);

  const value = useMemo(
    () => ({
      slug,
      items,
      totalQuantity: totals.totalQuantity,
      totalAmount: totals.totalAmount,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [slug, items, totals, addItem, updateQuantity, removeItem, clearCart],
  );

  return (
    <StorefrontCartContext.Provider value={value}>
      {children}
    </StorefrontCartContext.Provider>
  );
}
