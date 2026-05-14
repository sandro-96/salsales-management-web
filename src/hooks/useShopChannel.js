import { useEffect, useRef } from "react";
import { useWebSocket } from "./useWebSocket.js";
import { useShop } from "./useShop.js";

/**
 * Subscribe realtime channel cấp shop: `/topic/shops/{shopId}/{domain}`.
 * Tương tự {@link useBranchChannel} nhưng không gắn branchId — dùng cho event
 * shop-level (vd: đơn online tạo qua storefront).
 *
 * @param {string} domain - vd "orders/online"
 * @param {(msg:{type:string, data:any}) => void} onMessage
 * @param {{ enabled?: boolean, shopId?: string }} [options]
 */
export function useShopChannel(domain, onMessage, options = {}) {
  const { subscribe, connected } = useWebSocket();
  const { selectedShopId } = useShop();

  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  const shopId = options.shopId ?? selectedShopId;
  const enabled = options.enabled !== false;

  useEffect(() => {
    if (!enabled) return;
    if (!connected) return;
    if (!shopId || !domain) return;

    const dest = `/topic/shops/${shopId}/${domain}`;
    const unsub = subscribe(dest, (msg) => {
      try {
        handlerRef.current?.(msg);
      } catch (err) {
        console.error(`useShopChannel handler error (${dest}):`, err);
      }
    });

    return () => {
      try {
        unsub?.();
      } catch (err) {
        console.warn(`useShopChannel unsub error (${dest}):`, err);
      }
    };
  }, [enabled, connected, shopId, domain, subscribe]);
}
