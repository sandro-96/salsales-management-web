import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { useAlertDialog } from "@/hooks/useAlertDialog.js";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../../api/notificationApi.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";
import {
  getNotificationMessage,
  getNotificationTitle,
} from "../../utils/notificationI18n.js";

const NOTIFICATION_TYPE_ICON = {
  ORDER_CREATED: "🛒",
  ORDER_UPDATED: "📦",
  ORDER_PAID: "💰",
  STAFF_ADDED: "👤",
  STAFF_REMOVED: "🚫",
  TICKET_CREATED: "🎫",
  TICKET_REPLIED: "💬",
  TICKET_STATUS_CHANGED: "🔄",
  BILLING_PAYMENT_SUCCESS: "✅",
  BILLING_PAYMENT_FAILED: "❌",
  BILLING_MANUAL_TRANSFER_PENDING: "🏦",
  BILLING_PLAN_EXPIRING_SOON: "⏳",
  BILLING_PLAN_EXPIRED: "⚠️",
  BROADCAST: "📢",
  SYSTEM: "⚙️",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedShopId, fetchShops, setSelectedShop } = useShop();
  const { alert } = useAlertDialog();
  const { subscribe, connected } = useWebSocket();
  const { t, i18n } = useTranslation();
  const kickedFromShopRef = useRef(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Notifications are user-scoped, not shop-scoped
      const res = await getUnreadCount();
      if (res.data?.success) {
        setUnreadCount(res.data.data?.count ?? 0);
      }
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  }, [user?.id]);

  const fetchPreview = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getNotifications({
        page: 0,
        size: 5,
      });
      if (res.data?.success) {
        const data = res.data.data;
        setNotifications(data?.content ?? (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error("Fetch notifications preview error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user?.id || !connected) return;

    const unsub = subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type === WebSocketMessageTypes.NOTIFICATION && message.data) {
        setUnreadCount((c) => c + 1);
        setNotifications((prev) => [message.data, ...prev].slice(0, 5));
        toast.info(getNotificationTitle(t, message.data), {
          description: getNotificationMessage(t, message.data),
        });
        // Phát event cho các widget phụ (vd. badge hỗ trợ trong AdminLayout)
        // refresh mà không cần tự subscribe duplicate cùng topic.
        const notifType = message.data.type;
        if (
          notifType === "TICKET_CREATED" ||
          notifType === "TICKET_REPLIED"
        ) {
          window.dispatchEvent(new CustomEvent("admin-support-badge-refresh"));
        }

        // Realtime shop membership changes
        if (notifType === "STAFF_ADDED" || notifType === "STAFF_REMOVED") {
          // Refresh shop list so role/permissions update immediately
          fetchShops?.();

          // If user is removed from the currently selected shop, clear context + redirect.
          const removedFromSelected =
            notifType === "STAFF_REMOVED" &&
            message.data?.shopId &&
            String(message.data.shopId) === String(selectedShopId);
          if (removedFromSelected) {
            if (kickedFromShopRef.current) return;
            kickedFromShopRef.current = true;

            // Re-fetch shop list, then auto-select the first shop if any.
            // Finally redirect to "/" so DynamicDashboardLayout routes to the first valid nav item.
            (async () => {
              const list = await fetchShops?.();
              if (Array.isArray(list) && list.length > 0) {
                navigate("/", { replace: true });
              } else {
                navigate("/shops", { replace: true });
              }
            })();

            // Show a blocking alert so user knows why menus changed
            setTimeout(() => {
              alert(t("shop.kickedMessage"), {
                title: t("shop.kickedTitle"),
                confirmText: t("common.reload"),
              }).then(() => {
                window.location.reload();
              });
            }, 0);
          }
        }
      }
    });

    return unsub;
  }, [
    user?.id,
    connected,
    subscribe,
    fetchShops,
    selectedShopId,
    setSelectedShop,
    navigate,
    alert,
    t,
  ]);

  useEffect(() => {
    if (open) fetchPreview();
  }, [open, fetchPreview]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const isSystemAdmin =
    typeof user?.role === "string"
      ? user.role.includes("ROLE_ADMIN")
      : Array.isArray(user?.role)
        ? user.role.includes("ROLE_ADMIN")
        : false;

  const notificationsRoute = isSystemAdmin
    ? "/admin/notifications"
    : "/notifications";

  const handleClickNotification = async (notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }

    setOpen(false);

    if (notification.referenceType === "TICKET" && notification.referenceId) {
      const base = isSystemAdmin ? "/admin/support" : "/support";
      navigate(
        `${base}?ticketId=${encodeURIComponent(notification.referenceId)}`,
      );
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;
      return format(new Date(d), "dd/MM HH:mm", { locale: dateLocale });
    } catch {
      return "";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 z-[100] shadow-lg border bg-popover"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <h4 className="text-sm font-semibold">
            {t("header.notifications.title")}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
            >
              <Check className="mr-1 h-3 w-3" />
              {t("header.notifications.markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {t("header.notifications.empty")}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${
                  !n.read ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">
                    {NOTIFICATION_TYPE_ICON[n.type] || "📌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium line-clamp-1">
                        {getNotificationTitle(t, n)}
                      </span>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {getNotificationMessage(t, n)}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-1.5 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8"
            onClick={() => {
              setOpen(false);
              navigate(notificationsRoute);
            }}
          >
            {t("header.notifications.viewAll")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
