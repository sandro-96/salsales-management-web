import { useState, useEffect, useRef } from "react";
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

import { getTicket, replyToTicket, updateTicketStatus } from "../../api/supportApi.js";

const STATUS_MAP = {
  OPEN: { label: "Mở", variant: "default" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "secondary" },
  RESOLVED: { label: "Đã giải quyết", variant: "outline" },
  CLOSED: { label: "Đã đóng", variant: "destructive" },
};

const PRIORITY_MAP = {
  LOW: { label: "Thấp", className: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Trung bình", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Cao", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Khẩn cấp", className: "bg-red-100 text-red-700" },
};

const CATEGORY_MAP = {
  GENERAL: "Chung",
  ORDER: "Đơn hàng",
  PRODUCT: "Sản phẩm",
  PAYMENT: "Thanh toán",
  ACCOUNT: "Tài khoản",
  OTHER: "Khác",
};

export default function TicketDetailModal({ open, onOpenChange, shopId, ticketId, isManager, currentUserId, onUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && ticketId) {
      fetchTicket();
    }
  }, [open, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await getTicket(shopId, ticketId);
      if (res.data?.success) {
        setTicket(res.data.data);
      }
    } catch (err) {
      console.error("Fetch ticket error:", err);
      toast.error("Không thể tải chi tiết ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await replyToTicket(shopId, ticketId, { message: replyText });
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
      const res = await updateTicketStatus(shopId, ticketId, { status: newStatus });
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
    } catch { return d; }
  };

  const statusInfo = STATUS_MAP[ticket?.status] || STATUS_MAP.OPEN;
  const priorityInfo = PRIORITY_MAP[ticket?.priority] || PRIORITY_MAP.MEDIUM;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {loading ? "Đang tải..." : ticket?.subject || "Chi tiết ticket"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge className={priorityInfo.className}>{priorityInfo.label}</Badge>
              <Badge variant="outline">{CATEGORY_MAP[ticket.category] || ticket.category}</Badge>
              <span className="text-muted-foreground ml-auto">
                {ticket.userName} &middot; {formatDate(ticket.createdAt)}
              </span>
            </div>

            {/* Status change for manager */}
            {isManager && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Chuyển trạng thái:</span>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className="w-44 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}

            <Separator />

            {/* Original message */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 max-h-60">
              {ticket.replies?.map((reply) => {
                const isOwner = reply.userId === ticket.userId;
                return (
                  <div
                    key={reply.id}
                    className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isOwner
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{reply.userName}</span>
                        <span className="text-xs opacity-70">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            {ticket.status !== "CLOSED" && (
              <div className="flex gap-2 items-end pt-2 border-t">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleReply();
                    }
                  }}
                />
                <Button size="icon" onClick={handleReply} disabled={sending || !replyText.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
