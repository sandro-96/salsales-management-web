import { useCallback, useEffect } from "react";
import {
  countInStorePendingOrders,
  countOnlinePendingOrders,
} from "@/api/orderApi";
import { useShopChannel } from "@/hooks/useShopChannel.js";
import { useBranchChannel } from "@/hooks/useBranchChannel.js";
import { WebSocketMessageTypes } from "@/constants/websocket.js";
import {
  pulseBrowserTabOnNewOrder,
  setBrowserTabPendingCount,
  clearBrowserTabOrderAlert,
} from "@/utils/browserTabTitle.js";

/**
 * Cập nhật tiêu đề tab trình duyệt: (n) + nhấp nháy khi có đơn online / QR bàn mới.
 */
export function useBrowserTabOrderAlert({
  shopId,
  branchId,
  enabled = true,
} = {}) {
  const refresh = useCallback(async () => {
    if (!enabled || !shopId) {
      clearBrowserTabOrderAlert();
      return;
    }
    try {
      const [onlineRes, inStoreRes] = await Promise.all([
        countOnlinePendingOrders(shopId),
        countInStorePendingOrders(shopId),
      ]);
      const online =
        onlineRes.data?.data?.page?.totalElements ??
        onlineRes.data?.data?.totalElements ??
        0;
      const inStore =
        inStoreRes.data?.data?.page?.totalElements ??
        inStoreRes.data?.data?.totalElements ??
        0;
      setBrowserTabPendingCount(online + inStore);
    } catch {
      setBrowserTabPendingCount(0);
    }
  }, [shopId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !shopId) {
      clearBrowserTabOrderAlert();
    }
  }, [enabled, shopId]);

  const onGuestOrderEvent = useCallback(
    (msg) => {
      const type = msg?.type;
      const source = (msg?.data?.orderSource || "").toUpperCase();

      if (type === WebSocketMessageTypes.ONLINE_ORDER_CREATED) {
        refresh().then(() => pulseBrowserTabOnNewOrder());
        return;
      }

      if (type === WebSocketMessageTypes.ORDER_CREATED) {
        if (source === "IN_STORE") {
          refresh().then(() => pulseBrowserTabOnNewOrder());
        } else {
          refresh();
        }
        return;
      }

      if (
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

  useShopChannel("orders/online", onGuestOrderEvent, {
    enabled: enabled && !!shopId,
  });

  useBranchChannel("orders", onGuestOrderEvent, {
    enabled: enabled && !!shopId && !!branchId,
    shopId,
    branchId,
  });
}
