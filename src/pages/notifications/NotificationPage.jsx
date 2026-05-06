import { useState, useEffect, useCallback } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../api/notificationApi.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";

const NOTIFICATION_TYPE_ICON = {
  ORDER_CREATED: "🛒",
  ORDER_UPDATED: "📦",
  ORDER_PAID: "💰",
  STAFF_ADDED: "👤",
  STAFF_REMOVED: "🚫",
  TICKET_CREATED: "🎫",
  TICKET_REPLIED: "💬",
  TICKET_STATUS_CHANGED: "🔄",
  SYSTEM: "⚙️",
};

const NOTIFICATION_TYPE_LABEL = {
  ORDER_CREATED: "Đơn hàng mới",
  ORDER_UPDATED: "Cập nhật đơn",
  ORDER_PAID: "Thanh toán",
  STAFF_ADDED: "Nhân viên mới",
  STAFF_REMOVED: "Xóa nhân viên",
  TICKET_CREATED: "Ticket mới",
  TICKET_REPLIED: "Phản hồi ticket",
  TICKET_STATUS_CHANGED: "Cập nhật ticket",
  SYSTEM: "Hệ thống",
};

const groupByDate = (notifications) => {
  const groups = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    let key;
    if (isToday(date)) key = "Hôm nay";
    else if (isYesterday(date)) key = "Hôm qua";
    else key = format(date, "dd/MM/yyyy", { locale: vi });

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
};

const NotificationPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [readFilter, setReadFilter] = useState("__all__");
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      if (readFilter !== "__all__") params.read = readFilter;

      const res = await getNotifications(params);
      if (res.data?.success) {
        const data = res.data.data;
        if (data && "content" in data) {
          setNotifications(data.content ?? []);
          setTotalCount(data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setNotifications(list);
          setTotalCount(list.length);
        }
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
      toast.error("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id || !connected) return;

    const unsub = subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type === WebSocketMessageTypes.NOTIFICATION && message.data) {
        setNotifications((prev) => [message.data, ...prev]);
        setTotalCount((c) => c + 1);
      }
    });

    return unsub;
  }, [user?.id, connected, subscribe]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Đã đánh dấu tất cả đã đọc.");
    } catch (err) {
      console.error("Mark all read error:", err);
      toast.error("Thao tác thất bại.");
    }
  };

  const handleDelete = async (notification) => {
    try {
      await deleteNotification(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setTotalCount((c) => c - 1);
    } catch (err) {
      console.error("Delete notification error:", err);
      toast.error("Xóa thông báo thất bại.");
    }
  };

  const formatTime = (d) => {
    if (!d) return "";
    try {
      return format(new Date(d), "HH:mm", { locale: vi });
    } catch {
      return "";
    }
  };

  const grouped = groupByDate(notifications);
  const totalPages = Math.ceil(totalCount / pageSize);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} thông báo
            {unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={readFilter}
            onValueChange={(v) => {
              setReadFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              <SelectItem value="false">Chưa đọc</SelectItem>
              <SelectItem value="true">Đã đọc</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" />
              Đọc tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-medium mb-1">Không có thông báo nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Khi có thông báo mới từ đơn hàng, nhân sự hoặc hỗ trợ, chúng sẽ hiển
            thị ở đây.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {dateLabel}
              </h3>
              <Card className="divide-y overflow-hidden">
                {items.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-primary/5 border-l-2 border-primary" : ""
                    }`}
                  >
                    <span className="text-xl mt-0.5">
                      {NOTIFICATION_TYPE_ICON[n.type] || "📌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-sm font-medium break-words flex-1 min-w-0">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {NOTIFICATION_TYPE_LABEL[n.type] || n.type}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 break-words">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(n.createdAt)}
                        </span>
                        {n.actorName && (
                          <span className="text-xs text-muted-foreground">
                            • {n.actorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n);
                          }}
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n);
                        }}
                        title="Xóa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
