import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
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

const defaultAdapter = {
  getTicket: (_shopId, ticketId) => defaultGetTicket(ticketId),
  reply: (_shopId, ticketId, data) => defaultReplyToTicket(ticketId, data),
  updateStatus: (_shopId, ticketId, data) =>
    defaultUpdateTicketStatus(ticketId, data),
};

const PRIORITY_BADGE_CLASS = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-muted dark:text-foreground",
  MEDIUM:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  HIGH:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
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
          <span className={isMine ? "opacity-80" : ""}>
            {formatDate(createdAt)}
          </span>
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
  const { t, i18n } = useTranslation();

  const dateFnsLocale = useMemo(
    () => (i18n.language?.startsWith("en") ? enUS : vi),
    [i18n.language],
  );

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef(null);

  const formatDate = useCallback(
    (d) => {
      if (!d) return "";
      try {
        return format(new Date(d), "dd/MM/yyyy HH:mm", {
          locale: dateFnsLocale,
        });
      } catch {
        return d;
      }
    },
    [dateFnsLocale],
  );

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
        if (!silent) toast.error(t("pages.support.detail.fetchError"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [shopId, ticketId, apiAdapter, t],
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

  useEffect(() => {
    if (!open || !ticketId || !user?.id || !connected) return;
    const unsub = subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type !== WebSocketMessageTypes.NOTIFICATION || !message.data)
        return;
      const d = message.data;
      if (!TICKET_LIST_WS_TYPES.has(d.type)) return;
      if (d.referenceType !== "TICKET") return;
      if (d.referenceId !== ticketId) return;
      fetchTicket(true);
    });
    return unsub;
  }, [open, ticketId, user?.id, connected, subscribe, fetchTicket]);

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
      const res = await apiAdapter.reply(shopId, ticketId, {
        message: replyText,
      });
      if (res.data?.success) {
        setTicket(res.data.data);
        setReplyText("");
        onUpdated?.();
      } else {
        toast.error(
          res.data?.message || t("pages.support.detail.replyFail"),
        );
      }
    } catch (err) {
      console.error("Reply error:", err);
      toast.error(t("pages.support.detail.replyError"));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await apiAdapter.updateStatus(shopId, ticketId, {
        status: newStatus,
      });
      if (res.data?.success) {
        setTicket(res.data.data);
        toast.success(t("pages.support.detail.statusSuccess"));
        onUpdated?.();
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(t("pages.support.detail.statusFail"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const priorityKey = ticket?.priority || "MEDIUM";
  const priorityClass =
    PRIORITY_BADGE_CLASS[priorityKey] || PRIORITY_BADGE_CLASS.MEDIUM;

  const currentId = user?.id;
  const isReplyMine = (reply) => currentId && reply.userId === currentId;
  const isOriginalMine = currentId && ticket?.userId === currentId;
  const canChangeStatus =
    Boolean(isManager) ||
    Boolean(ticket && currentId && ticket.userId === currentId);

  const statusLabel = (code) =>
    t(`pages.support.ticketStatus.${code}`, { defaultValue: code });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !max-h-[min(90vh,720px)] w-full flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg sm:max-w-2xl">
        <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogHeader>
            <DialogTitle className="pr-2 leading-snug">
              {loading
                ? t("pages.support.detail.loading")
                : ticket?.subject || t("pages.support.detail.titleFallback")}
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
                <Badge
                  variant="outline"
                  className={ticketStatusBadgeClass(ticket.status)}
                >
                  {statusLabel(ticket.status)}
                </Badge>
                <Badge className={priorityClass}>
                  {t(`pages.support.priority.${priorityKey}`, {
                    defaultValue: priorityKey,
                  })}
                </Badge>
                <Badge variant="outline">
                  {t(`pages.support.category.${ticket.category}`, {
                    defaultValue: ticket.category,
                  })}
                </Badge>
                <span className="text-muted-foreground ml-auto text-xs sm:text-sm">
                  {ticket.userName} &middot; {formatDate(ticket.createdAt)}
                </span>
              </div>

              {canChangeStatus && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("pages.support.detail.changeStatus")}
                  </span>
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(TICKET_STATUS_MAP).map((k) => (
                        <SelectItem key={k} value={k}>
                          {statusLabel(k)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdating && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              )}
            </div>

            <Separator className="my-4 shrink-0" />

            <div className="flex min-h-0 flex-1 flex-col px-6">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 pb-2">
                <MessageBubble
                  isMine={isOriginalMine}
                  userName={
                    ticket.userName || t("pages.support.detail.ticketAuthor")
                  }
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
                      placeholder={t("pages.support.detail.replyPlaceholder")}
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
                    {t("pages.support.detail.shortcutHint")}
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
