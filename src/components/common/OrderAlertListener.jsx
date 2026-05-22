import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useShopChannel } from "@/hooks/useShopChannel.js";
import { useOrderAlertSound } from "@/hooks/useOrderAlertSound.js";
import { useShop } from "@/hooks/useShop.js";
import { useShopPermissions } from "@/hooks/useShopPermissions.js";
import { PERM } from "@/constants/shopPermissions.js";
import { WebSocketMessageTypes } from "@/constants/websocket.js";
import { unlockOrderAlertAudio } from "@/utils/orderAlertSound.js";
import { buildOrdersListUrl } from "@/utils/orderNavigation.js";
import { useBrowserTabOrderAlert } from "@/hooks/useBrowserTabOrderAlert.js";

/**
 * Phát âm thanh + toast khi có đơn online hoặc đơn tại bàn (WS shop channel).
 */
export default function OrderAlertListener() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedShopId, shops, selectedBranchId } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canHear = hasShopPermission(PERM.ORDER_VIEW);
  const { enabled, playOnline, playInStore } = useOrderAlertSound();

  useBrowserTabOrderAlert({
    shopId: selectedShopId,
    branchId: selectedBranchId,
    enabled: canHear && !!selectedShopId && shops.length > 0,
  });

  useEffect(() => {
    const unlock = () => unlockOrderAlertAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const onShopOrderEvent = useCallback(
    (msg) => {
      if (!canHear || !enabled) return;
      if (msg?.type !== WebSocketMessageTypes.ONLINE_ORDER_CREATED) return;

      const data = msg.data || {};
      const isInStore = data.orderSource === "IN_STORE";
      const code = data.orderCode || data.orderId || "";
      const customer =
        data.customerName || t("pages.orders.list.onlineOrderGuest");
      const ordersUrl = buildOrdersListUrl({
        source: "ONLINE",
        branchId: data.branchId || undefined,
        orderId: data.orderId || undefined,
      });

      if (isInStore) {
        playInStore();
        toast.info(t("pages.orders.list.inStoreOrderToast", { code }), {
          description: t("pages.orders.list.inStoreOrderDesc", { customer }),
          action: {
            label: t("pages.orders.list.viewOnlineOrders"),
            onClick: () => navigate(ordersUrl),
          },
        });
      } else {
        playOnline();
        toast.info(t("pages.orders.list.onlineOrderToast", { code }), {
          description: t("pages.orders.list.onlineOrderDesc", {
            customer,
            phone: data.customerPhone ? ` · ${data.customerPhone}` : "",
          }),
          action: {
            label: t("pages.orders.list.viewOnlineOrders"),
            onClick: () => navigate(ordersUrl),
          },
        });
      }
    },
    [canHear, enabled, navigate, playInStore, playOnline, t],
  );

  useShopChannel("orders/online", onShopOrderEvent, {
    enabled: canHear && !!selectedShopId && shops.length > 0,
  });

  return null;
}
