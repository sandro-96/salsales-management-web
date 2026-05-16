import { useCallback, useEffect, useState } from "react";
import {
  countOnlinePendingOrders,
  countPosPendingOrders,
} from "@/api/orderApi";
import { useShopChannel } from "@/hooks/useShopChannel";
import { useBranchChannel } from "@/hooks/useBranchChannel";
import { WebSocketMessageTypes } from "@/constants/websocket";

/**
 * Tổng đơn PENDING (POS theo chi nhánh + online toàn shop) cho badge menu Đơn hàng.
 */
export function useNavOrderBadge({ shopId, branchId, enabled = true }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled || !shopId) {
      setCount(0);
      return;
    }
    const branchParams = branchId ? { branchId } : {};
    try {
      const [posRes, onlineRes] = await Promise.all([
        countPosPendingOrders(shopId, branchParams),
        countOnlinePendingOrders(shopId),
      ]);
      const pos =
        posRes.data?.data?.page?.totalElements ??
        posRes.data?.data?.totalElements ??
        0;
      const online =
        onlineRes.data?.data?.page?.totalElements ??
        onlineRes.data?.data?.totalElements ??
        0;
      setCount(pos + online);
    } catch {
      setCount(0);
    }
  }, [shopId, branchId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onWs = useCallback(
    (msg) => {
      const type = msg?.type;
      if (
        type === WebSocketMessageTypes.ONLINE_ORDER_CREATED ||
        type === WebSocketMessageTypes.ORDER_CREATED ||
        type === WebSocketMessageTypes.ORDER_UPDATED ||
        type === WebSocketMessageTypes.ORDER_STATUS_CHANGED ||
        type === WebSocketMessageTypes.PAYMENT_SUCCEEDED ||
        type === WebSocketMessageTypes.ORDER_DELETED
      ) {
        refresh();
      }
    },
    [refresh],
  );

  useShopChannel("orders/online", onWs, { enabled: enabled && !!shopId });
  useBranchChannel("orders", onWs, {
    enabled: enabled && !!shopId && !!branchId,
    shopId,
    branchId,
  });

  return count;
}
