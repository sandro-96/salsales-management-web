import { useEffect, useRef } from "react";
import { useWebSocket } from "./useWebSocket.js";
import { useShop } from "./useShop.js";

/**
 * Subscribe realtime channel theo shop+branch hiện tại: `/topic/shops/{shopId}/branches/{branchId}/{domain}`.
 *
 * - `onMessage` được giữ qua ref để không trigger resubscribe khi reference đổi mỗi render.
 * - Auto unsubscribe + resubscribe khi `shopId`, `branchId`, `domain`, hoặc
 *   trạng thái WS connected thay đổi.
 * - Caller nhận được payload chuẩn `{ type, data }` (xem `WebSocketMessage<T>` ở BE)
 *   và tự lọc theo `type` để xử lý.
 *
 * @param {string} domain - "orders" | "tables" | "payments" | ...
 * @param {(msg:{type:string, data:any}) => void} onMessage
 * @param {{ enabled?: boolean, shopId?: string, branchId?: string }} [options]
 */
export function useBranchChannel(domain, onMessage, options = {}) {
  const { subscribe, connected } = useWebSocket();
  const { selectedShopId, selectedBranchId } = useShop();

  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  const shopId = options.shopId ?? selectedShopId;
  const branchId = options.branchId ?? selectedBranchId;
  const enabled = options.enabled !== false;

  useEffect(() => {
    if (!enabled) return;
    if (!connected) return;
    if (!shopId || !branchId || !domain) return;

    const dest = `/topic/shops/${shopId}/branches/${branchId}/${domain}`;
    const unsub = subscribe(dest, (msg) => {
      try {
        handlerRef.current?.(msg);
      } catch (err) {
        console.error(`useBranchChannel handler error (${dest}):`, err);
      }
    });

    return () => {
      try {
        unsub?.();
      } catch (err) {
        console.warn(`useBranchChannel unsub error (${dest}):`, err);
      }
    };
  }, [enabled, connected, shopId, branchId, domain, subscribe]);
}
