import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Send } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  getTicket as defaultGetTicket,
  replyToTicket as defaultReplyToTicket,
  updateTicketStatus as defaultUpdateTicketStatus,
} from "../../api/supportApi.js";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketMessageTypes } from "@/constants/websocket.js";
import {
  TICKET_STATUS_MAP,
  TICKET_LIST_WS_TYPES,
  ticketStatusBadgeClass,
} from "@/constants/supportTicketStatus.js";

/**
 * Adapter mặc định cho trang hỗ trợ phía shop. Nhận shopId + ticketId.
 * AdminSupportPage truyền adapter riêng (không cần shopId).
 */
const defaultAdapter = {
  getTicket: (shopId, ticketId) => defaultGetTicket(shopId, ticketId),
  reply: (shopId, ticketId, data) => defaultReplyToTicket(shopId, ticketId, data),
  updateStatus: (shopId, ticketId, data) =>
    defaultUpdateTicketStatus(shopId, ticketId, data),
};

const PRIORITY_MAP = {
  LOW: {
    label: "Thấp",
    className: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-foreground",
  },
  MEDIUM: {
    label: "Trung bình",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  },
  HIGH: {
    label: "Cao",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  },
  URGENT: {
    label: "Khẩn cấp",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  },
};

const CATEGORY_MAP = {
  GENERAL: "Chung",
  ORDER: "Đơn hàng",
  PRODUCT: "Sản phẩm",
  PAYMENT: "Thanh toán",
  ACCOUNT: "Tài khoản",
  OTHER: "Khác",
};

function MessageBubble({ isMine, userName, createdAt, body, formatDate }) {
  return (
    <div className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(85%,28rem)] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isMine
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md border border-border/60"
        }`}
      >
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1 text-xs ${
            isMine ? "opacity-90 justify-end" : "text-muted-foreground"
          }`}
        >
          <span className="font-medium">{userName}</span>
          <span className={isMine ? "opacity-80" : ""}>{formatDate(createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function TicketDetailModal({
  open,
  onOpenChange,
  shopId,
  ticketId,
  isManager,
  onUpdated,
  apiAdapter = defaultAdapter,
}) {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTicket = useCallback(
    async (silent = false) => {
      if (!ticketId) return;
      try {
        if (!silent) setLoading(true);
        const res = await apiAdapter.getTicket(shopId, ticketId);
        if (res.data?.success) {
          setTicket(res.data.data);
        }
      } catch (err) {
        console.error("Fetch ticket error:", err);
        if (!silent) toast.error("Không thể tải chi tiết ticket.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [shopId, ticketId, apiAdapter],
  );

  useEffect(() => {
    if (open && ticketId) {
      fetchTicket(false);
    }
    if (!open) {
      setTicket(null);
      setReplyText("");
    }
  }, [open, ticketId, fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies, ticket?.message, ticket?.updatedAt, ticket?.status]);

  /** Realtime: server gửi notification khi có reply / đổi trạng thái */
  useEffect(() => {
    if (!open || !ticketId || !user?.id || !connected) return;
    const unsub = subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type !== WebSocketMessageTypes.NOTIFICATION || !message.data) return;
      const d = message.data;
      if (!TICKET_LIST_WS_TYPES.has(d.type)) return;
      if (d.referenceType !== "TICKET") return;
      if (d.referenceId !== ticketId) return;
      fetchTicket(true);
    });
    return unsub;
  }, [open, ticketId, user?.id, connected, subscribe, fetchTicket]);

  /** Fallback khi WS chậm / tab khác */
  useEffect(() => {
    if (!open || !ticketId) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchTicket(true);
    }, 14000);
    return () => clearInterval(id);
  }, [open, ticketId, fetchTicket]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await apiAdapter.reply(shopId, ticketId, { message: replyText });
      if (res.data?.success) {
        setTicket(res.data.data);
        setReplyText("");
        onUpdated?.();
      } else {
        toast.error(res.data?.message || "Gửi phản hồi thất bại.");
      }
    } catch (err) {
      console.error("Reply error:", err);
      toast.error("Đã xảy ra lỗi khi gửi phản hồi.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await apiAdapter.updateStatus(shopId, ticketId, { status: newStatus });
      if (res.data?.success) {
        setTicket(res.data.data);
        toast.success("Cập nhật trạng thái thành công.");
        onUpdated?.();
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Cập nhật trạng thái thất bại.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return d;
    }
  };

  const statusCfg = TICKET_STATUS_MAP[ticket?.status] || TICKET_STATUS_MAP.OPEN;
  const priorityInfo = PRIORITY_MAP[ticket?.priority] || PRIORITY_MAP.MEDIUM;

  const currentId = user?.id;
  const isReplyMine = (reply) => currentId && reply.userId === currentId;
  const isOriginalMine = currentId && ticket?.userId === currentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !max-h-[min(90vh,720px)] w-full flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:max-w-2xl">
        <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogHeader>
            <DialogTitle className="pr-2 leading-snug">
              {loading ? "Đang tải..." : ticket?.subject || "Chi tiết ticket"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <div className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="shrink-0 space-y-3 px-6 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className={ticketStatusBadgeClass(ticket.status)}>
                  {statusCfg.label}
                </Badge>
                <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>
                <Badge variant="outline">{CATEGORY_MAP[ticket.category] || ticket.category}</Badge>
                <span className="text-muted-foreground ml-auto text-xs sm:text-sm">
                  {ticket.userName} &middot; {formatDate(ticket.createdAt)}
                </span>
              </div>

              {isManager && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Chuyển trạng thái:</span>
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              )}
            </div>

            <Separator className="my-4 shrink-0" />

            <div className="flex min-h-0 flex-1 flex-col px-6">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 pb-2">
                <MessageBubble
                  isMine={isOriginalMine}
                  userName={ticket.userName || "Người mở ticket"}
                  createdAt={ticket.createdAt}
                  body={ticket.message}
                  formatDate={formatDate}
                />

                {ticket.replies?.map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    isMine={isReplyMine(reply)}
                    userName={reply.userName || "—"}
                    createdAt={reply.createdAt}
                    body={reply.message}
                    formatDate={formatDate}
                  />
                ))}
                <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
              </div>

              {ticket.status !== "CLOSED" && (
                <div className="shrink-0 border-t border-border bg-background px-0 pb-5 pt-4">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi..."
                      rows={3}
                      className="min-h-[88px] flex-1 resize-none rounded-xl border bg-background shadow-none focus-visible:ring-2 focus-visible:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          handleReply();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl"
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Ctrl+Enter để gửi nhanh
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
