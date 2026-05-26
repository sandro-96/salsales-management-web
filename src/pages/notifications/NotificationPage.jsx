import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isValid,
  isYesterday,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";
import { NotificationStatCards } from "@/components/notifications/NotificationStatCards.jsx";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAlertDialog } from "@/hooks/useAlertDialog.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../api/notificationApi.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";
import {
  getNotificationMessage,
  getNotificationTitle,
} from "../../utils/notificationI18n.js";
import { getNotificationDestination } from "../../utils/notificationNavigation.js";
import {
  NOTIFICATION_UNREAD_REFRESH_EVENT,
  requestNotificationUnreadRefresh,
} from "../../utils/notificationEvents.js";
import { parseSpringPage } from "@/utils/springPage.js";

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

function groupByDate(notifications, t, dateLocale) {
  const groups = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    let key;
    if (isToday(date)) key = t("pages.notifications.today");
    else if (isYesterday(date)) key = t("pages.notifications.yesterday");
    else key = format(date, "dd/MM/yyyy", { locale: dateLocale });

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

function formatNotificationTime(date, dateFnsLocale, t) {
  const d = new Date(date);
  if (!isValid(d)) return "";
  const now = new Date();
  const hoursAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 48) {
    return formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocale });
  }
  if (isToday(d)) {
    return format(d, "HH:mm", { locale: dateFnsLocale });
  }
  if (isYesterday(d)) {
    return `${t("pages.notifications.yesterday")} ${format(d, "HH:mm", { locale: dateFnsLocale })}`;
  }
  return format(d, "dd/MM/yyyy HH:mm", { locale: dateFnsLocale });
}

function NotificationListSkeleton() {
  return (
    <Card className="divide-y overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          <section className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </section>
        </div>
      ))}
    </Card>
  );
}

const NotificationPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { confirm } = useAlertDialog();

  const isSystemAdmin = useMemo(() => {
    if (typeof user?.role === "string") return user.role.includes("ROLE_ADMIN");
    if (Array.isArray(user?.role)) return user.role.includes("ROLE_ADMIN");
    return location.pathname.startsWith("/admin");
  }, [user?.role, location.pathname]);

  const numberLocale = useMemo(
    () => (i18n.language?.startsWith("en") ? "en-US" : "vi-VN"),
    [i18n.language],
  );

  const dateFnsLocale = useMemo(
    () => (i18n.language?.startsWith("en") ? enUS : vi),
    [i18n.language],
  );

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [readFilter, setReadFilter] = useState("__all__");
  const pageSize = 20;

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      const [unreadRes, totalRes] = await Promise.all([
        getUnreadCount(),
        getNotifications({ page: 0, size: 1 }),
      ]);
      const unread =
        unreadRes.data?.success ? (unreadRes.data.data?.count ?? 0) : 0;
      let total = 0;
      if (totalRes.data?.success) {
        const parsed = parseSpringPage(totalRes.data.data);
        total = parsed.totalElements;
      }
      setStats({
        total,
        unread,
        read: Math.max(0, total - unread),
      });
    } catch (err) {
      console.error("Fetch notification stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      if (readFilter !== "__all__") params.read = readFilter;

      const res = await getNotifications(params);
      if (res.data?.success) {
        const { content, totalElements } = parseSpringPage(res.data.data);
        setNotifications(content);
        setTotalCount(totalElements);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
      toast.error(t("pages.notifications.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, readFilter, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleUnreadRefresh = async () => {
      await Promise.all([fetchStats(), fetchNotifications()]);
    };

    window.addEventListener(
      NOTIFICATION_UNREAD_REFRESH_EVENT,
      handleUnreadRefresh,
    );
    return () =>
      window.removeEventListener(
        NOTIFICATION_UNREAD_REFRESH_EVENT,
        handleUnreadRefresh,
      );
  }, [fetchNotifications, fetchStats]);

  useEffect(() => {
    if (!user?.id || !connected) return;

    const unsub = subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type === WebSocketMessageTypes.NOTIFICATION && message.data) {
        const incoming = message.data;
        if (readFilter === "true") return;
        if (readFilter === "false" && incoming.read) return;

        setNotifications((prev) => {
          if (prev.some((n) => n.id === incoming.id)) return prev;
          if (page !== 0) return prev;
          return [incoming, ...prev].slice(0, pageSize);
        });
        if (page === 0) {
          setTotalCount((c) => c + 1);
        }
        setStats((s) => ({
          total: s.total + 1,
          unread: incoming.read ? s.unread : s.unread + 1,
          read: incoming.read ? s.read + 1 : s.read,
        }));
      }
    });

    return unsub;
  }, [user?.id, connected, subscribe, readFilter, page, pageSize]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchNotifications()]);
    setRefreshing(false);
  };

  const handleFilterChange = (filter) => {
    setReadFilter(filter);
    setPage(0);
  };

  const navigateToNotification = (notification) => {
    const dest = getNotificationDestination(notification, isSystemAdmin);
    if (dest) navigate(dest);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        setStats((s) => ({
          ...s,
          unread: Math.max(0, s.unread - 1),
          read: s.read + 1,
        }));
        requestNotificationUnreadRefresh();
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
    navigateToNotification(notification);
  };

  const handleMarkRead = async (notification, e) => {
    e?.stopPropagation();
    if (notification.read) return;
    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setStats((s) => ({
        ...s,
        unread: Math.max(0, s.unread - 1),
        read: s.read + 1,
      }));
      requestNotificationUnreadRefresh();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setStats((s) => ({
        total: s.total,
        unread: 0,
        read: s.total,
      }));
      requestNotificationUnreadRefresh();
      toast.success(t("pages.notifications.markAllSuccess"));
    } catch (err) {
      console.error("Mark all read error:", err);
      toast.error(t("pages.notifications.markAllFail"));
    }
  };

  const handleDelete = async (notification, e) => {
    e?.stopPropagation();
    const ok = await confirm(t("pages.notifications.deleteConfirm"), {
      title: t("pages.notifications.deleteTitle"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!ok) return;

    try {
      await deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setTotalCount((c) => Math.max(0, c - 1));
      setStats((s) => ({
        total: Math.max(0, s.total - 1),
        unread: notification.read ? s.unread : Math.max(0, s.unread - 1),
        read: notification.read ? Math.max(0, s.read - 1) : s.read,
      }));
      if (!notification.read) {
        requestNotificationUnreadRefresh();
      }
      toast.success(t("pages.notifications.deleteSuccess"));
    } catch (err) {
      console.error("Delete notification error:", err);
      toast.error(t("pages.notifications.deleteFail"));
    }
  };

  const grouped = useMemo(
    () => groupByDate(notifications, t, dateFnsLocale),
    [notifications, t, dateFnsLocale],
  );
  const totalPages = Math.ceil(totalCount / pageSize);

  const typeLabel = (type) =>
    t(`pages.notifications.types.${type}`, { defaultValue: type });

  const emptyContent = useMemo(() => {
    if (readFilter === "false") {
      return {
        title: t("pages.notifications.emptyUnreadTitle"),
        desc: t("pages.notifications.emptyUnreadDesc"),
      };
    }
    if (readFilter === "true") {
      return {
        title: t("pages.notifications.emptyReadTitle"),
        desc: t("pages.notifications.emptyReadDesc"),
      };
    }
    return {
      title: t("pages.notifications.emptyTitle"),
      desc: t("pages.notifications.emptyDesc"),
    };
  }, [readFilter, t]);

  const showActions = isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100";

  return (
    <section className="flex-1 flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full min-w-0">
      <ListPageHeader
        icon={Bell}
        title={t("pages.notifications.title")}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{t("pages.notifications.subtitle")}</span>
            {connected && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("pages.notifications.live")}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="h-9"
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {t("pages.notifications.refresh")}
            </Button>
            {stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-9"
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                {t("pages.notifications.markAll")}
              </Button>
            )}
          </>
        }
      />

      <NotificationStatCards
        stats={stats}
        activeFilter={readFilter}
        loading={statsLoading}
        onFilterChange={handleFilterChange}
        numberLocale={numberLocale}
      />

      {loading && notifications.length === 0 ? (
        <NotificationListSkeleton />
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-medium mb-1">{emptyContent.title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {emptyContent.desc}
          </p>
          {readFilter !== "__all__" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange("__all__")}
            >
              {t("pages.notifications.showAll")}
            </Button>
          )}
        </Card>
      ) : (
        <section className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
                {dateLabel}
              </h3>
              <Card className="divide-y overflow-hidden">
                {items.map((n) => {
                  const dest = getNotificationDestination(n, isSystemAdmin);
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotificationClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(n);
                        }
                      }}
                      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                        !n.read
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : ""
                      }`}
                    >
                      <span
                        className="text-xl mt-0.5 shrink-0 select-none"
                        aria-hidden
                      >
                        {NOTIFICATION_TYPE_ICON[n.type] || "📌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-sm font-medium break-words flex-1 min-w-0">
                              {getNotificationTitle(t, n)}
                            </span>
                            {!n.read && (
                              <span
                                className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5"
                                aria-label={t("pages.notifications.unread")}
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {typeLabel(n.type)}
                            </Badge>
                            {dest && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium">
                                <ExternalLink className="h-3 w-3" />
                                {t("pages.notifications.viewDetail")}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 break-words line-clamp-3 sm:line-clamp-none">
                          {getNotificationMessage(t, n)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(
                              n.createdAt,
                              dateFnsLocale,
                              t,
                            )}
                          </span>
                          {n.actorName && (
                            <span className="text-xs text-muted-foreground truncate">
                              • {n.actorName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-0.5 shrink-0 transition-opacity ${showActions}`}
                      >
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleMarkRead(n, e)}
                            title={t("pages.notifications.markReadTitle")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(n, e)}
                          title={t("pages.notifications.deleteTitle")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {dest && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <section className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("pages.notifications.prevPage")}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums px-2">
            {t("pages.notifications.pageOf", {
              current: page + 1,
              total: totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("pages.notifications.nextPage")}
          </Button>
        </section>
      )}
    </section>
  );
};

export default NotificationPage;
