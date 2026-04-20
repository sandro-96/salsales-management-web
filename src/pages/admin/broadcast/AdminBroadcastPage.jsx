// src/pages/admin/broadcast/AdminBroadcastPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Megaphone, Send } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import { listAdminBroadcasts, sendAdminBroadcast } from "@/api/adminApi";

const AUDIENCE_OPTIONS = [
  { value: "ALL_USERS", label: "Tất cả user" },
  { value: "SHOP_OWNERS", label: "Chủ shop" },
  { value: "SHOPS_BY_PLAN", label: "Shops theo plan" },
  { value: "ADMINS", label: "Admin hệ thống" },
];

const PLAN_OPTIONS = ["FREE", "PRO", "ENTERPRISE"];

const STATUS_BADGE = {
  DRAFT: "secondary",
  SENDING: "outline",
  SENT: "default",
  FAILED: "destructive",
};

const fmt = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return d;
  }
};

const emptyForm = {
  title: "",
  message: "",
  audience: "ALL_USERS",
  plan: "PRO",
  emailEnabled: false,
};

export default function AdminBroadcastPage() {
  const { hasAdminPermission, loading: permLoading } = useAdminPermissions();
  const canSend = hasAdminPermission(ADMIN_PERM.BROADCAST_SEND);

  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") || 0);
  const size = 20;

  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      const res = await listAdminBroadcasts({
        page,
        size,
        sort: "createdAt,desc",
      });
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được broadcast");
    } finally {
      setLoading(false);
    }
  }, [canSend, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(emptyForm);
    setConfirm(false);
    setDialogOpen(true);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    if (form.audience === "SHOPS_BY_PLAN" && !form.plan) {
      toast.error("Chọn plan cụ thể");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        plan: form.audience === "SHOPS_BY_PLAN" ? form.plan : null,
        emailEnabled: !!form.emailEnabled,
      };
      await sendAdminBroadcast(payload);
      toast.success("Đã gửi broadcast");
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gửi broadcast thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.totalElements || 0) / size));

  if (permLoading) return <Loading />;
  if (!canSend) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Broadcast</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bạn không có quyền BROADCAST_SEND.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Broadcast
          </h1>
          <p className="text-sm text-muted-foreground">
            Gửi thông báo hệ thống tới nhóm user (in-app mặc định; email tuỳ chọn).
          </p>
        </div>
        <Button onClick={openNew}>
          <Send className="h-4 w-4 mr-1" /> Gửi broadcast mới
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người nhận</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  Đang tải…
                </TableCell>
              </TableRow>
            )}
            {!loading && data.content?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  Chưa có broadcast nào.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.content?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div>{fmt(row.sentAt || row.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {row.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {row.audience}
                      {row.plan ? ` · ${row.plan}` : ""}
                    </Badge>
                    {row.emailEnabled ? (
                      <Badge variant="outline" className="ml-1">
                        +email
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[row.status] || "secondary"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.recipientCount ?? 0}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">
          Trang {page + 1} / {totalPages} · Tổng {data.totalElements || 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page - 1));
            setSp(n);
          }}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page + 1));
            setSp(n);
          }}
        >
          Sau
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Gửi broadcast</DialogTitle>
            <DialogDescription>
              Thao tác không thể thu hồi sau khi gửi. Chọn audience phù hợp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tiêu đề</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Nội dung</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, audience: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.audience === "SHOPS_BY_PLAN" && (
                <div className="space-y-1">
                  <Label>Plan</Label>
                  <Select
                    value={form.plan}
                    onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.emailEnabled}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, emailEnabled: !!v }))
                }
              />
              Gửi kèm email cho recipient
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={confirm}
                onCheckedChange={(v) => setConfirm(!!v)}
              />
              Tôi xác nhận đã xem nội dung; không thể thu hồi.
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={handleSend}
              disabled={submitting || !confirm}
            >
              Gửi ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
