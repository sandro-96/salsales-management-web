// src/pages/admin/shops/AdminShopDetailPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Lock,
  Unlock,
  CalendarClock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import {
  getAdminShopDetail,
  updateAdminShopStatus,
  extendAdminShopPlan,
  markAdminShopPaid,
  overrideAdminShopSubscriptionStatus,
} from "@/api/adminApi";

const STATUS_OPTIONS = ["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED"];
const GATEWAY_OPTIONS = ["MANUAL", "VNPAY", "MOMO"];

const fmt = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return d;
  }
};

function Stat({ label, value }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function subscriptionBadge(status) {
  switch (status) {
    case "TRIAL":
      return (
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
          Trial
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          Active
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">Expired</Badge>;
    case "CANCELLED":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status || "—"}</Badge>;
  }
}

export default function AdminShopDetailPage() {
  const { shopId } = useParams();
  const { hasAdminPermission } = useAdminPermissions();
  const canManageShop = hasAdminPermission(ADMIN_PERM.SHOP_MANAGE);
  const canManageBilling = hasAdminPermission(ADMIN_PERM.BILLING_MANAGE);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    subscriptionStatus: "ACTIVE",
    reason: "",
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const [extendOpen, setExtendOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  const [paidOpen, setPaidOpen] = useState(false);
  const [paidForm, setPaidForm] = useState({
    gateway: "MANUAL",
    transactionId: "",
    reason: "",
  });
  const [paidSubmitting, setPaidSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminShopDetail(shopId);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được chi tiết shop");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (!data) return <div className="p-6">Không tìm thấy.</div>;

  const s = data.summary || {};
  const expiryDate =
    s.subscriptionStatus === "TRIAL" ? s.trialEndsAt : s.currentPeriodEnd;

  const handleToggleStatus = async () => {
    setStatusSubmitting(true);
    try {
      await updateAdminShopStatus(s.id, {
        active: !s.active,
        reason: statusReason || null,
      });
      toast.success(s.active ? "Đã khoá shop" : "Đã mở khoá shop");
      setStatusOpen(false);
      setStatusReason("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleOverrideStatus = async () => {
    setOverrideSubmitting(true);
    try {
      await overrideAdminShopSubscriptionStatus(
        s.id,
        overrideForm.subscriptionStatus,
        overrideForm.reason || null,
      );
      toast.success("Đã cập nhật subscription");
      setOverrideOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handleExtendPlan = async () => {
    setExtendSubmitting(true);
    try {
      await extendAdminShopPlan(s.id, {
        months: Number(extendMonths) || 0,
      });
      toast.success("Đã gia hạn subscription");
      setExtendOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gia hạn thất bại");
    } finally {
      setExtendSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    setPaidSubmitting(true);
    try {
      await markAdminShopPaid(s.id, {
        gateway: paidForm.gateway,
        transactionId: paidForm.transactionId || null,
        reason: paidForm.reason || null,
      });
      toast.success("Đã xác nhận thanh toán 99.000đ");
      setPaidOpen(false);
      setPaidForm({ gateway: "MANUAL", transactionId: "", reason: "" });
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Xác nhận thất bại");
    } finally {
      setPaidSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/shops">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Danh sách
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2 flex-wrap">
            {s.name}
            {s.active ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="destructive">Locked</Badge>
            )}
            {subscriptionBadge(s.subscriptionStatus)}
            {s.daysRemaining != null && (
              <Badge variant="outline">{s.daysRemaining} ngày còn lại</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {canManageShop && (
              <Button
                size="sm"
                variant={s.active ? "destructive" : "default"}
                onClick={() => setStatusOpen(true)}
              >
                {s.active ? (
                  <>
                    <Lock className="h-4 w-4 mr-1" /> Khoá shop
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-1" /> Mở khoá
                  </>
                )}
              </Button>
            )}
            {canManageBilling && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setPaidForm({
                      gateway: "MANUAL",
                      transactionId: "",
                      reason: "",
                    });
                    setPaidOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Xác nhận đã thanh toán
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setExtendMonths(1);
                    setExtendOpen(true);
                  }}
                >
                  <CalendarClock className="h-4 w-4 mr-1" /> Gia hạn
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setOverrideForm({
                      subscriptionStatus: s.subscriptionStatus || "ACTIVE",
                      reason: "",
                    });
                    setOverrideOpen(true);
                  }}
                >
                  <ShieldAlert className="h-4 w-4 mr-1" /> Đổi trạng thái
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Shop ID</div>
              <div className="font-mono">{s.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Slug</div>
              <div>{s.slug}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Owner</div>
              <div>{s.ownerName || "—"}</div>
              <div className="text-xs text-muted-foreground">{s.ownerEmail}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Phí / kỳ</div>
              <div>
                {s.amountVnd != null
                  ? `${Number(s.amountVnd).toLocaleString("vi-VN")} ₫`
                  : "—"}{" "}
                <span className="text-xs text-muted-foreground">/ tháng</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Trial kết thúc</div>
              <div>{fmt(s.trialEndsAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Chu kỳ hiện tại hết hạn
              </div>
              <div>{fmt(s.currentPeriodEnd)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Lần thanh toán kế tiếp
              </div>
              <div>{fmt(s.nextBillingDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tạo lúc</div>
              <div>{fmt(s.createdAt)}</div>
            </div>
            {expiryDate && (
              <div className="md:col-span-2 text-xs text-muted-foreground">
                Mốc hiện tại: {fmt(expiryDate)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Chi nhánh" value={data.branchCount ?? 0} />
        <Stat label="Nhân sự" value={data.staffCount ?? 0} />
        <Stat label="Tổng đơn" value={data.totalOrderCount ?? 0} />
        <Stat label="Đơn 30 ngày" value={data.orderCountLast30d ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lịch sử subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {(!data.subscriptionHistory ||
            data.subscriptionHistory.length === 0) && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Chưa có lịch sử.
            </div>
          )}
          <ol className="space-y-2">
            {data.subscriptionHistory?.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-3 text-sm border rounded-md p-3"
              >
                <div className="min-w-[140px] text-muted-foreground">
                  {fmt(h.createdAt)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {h.actionType || h.action || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.durationMonths ? `${h.durationMonths} tháng` : ""}
                    {h.paymentMethod ? ` · ${h.paymentMethod}` : ""}
                    {h.transactionId ? ` · ${h.transactionId}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Chỉ admin có AdminPermission tương ứng (SHOP_MANAGE / BILLING_MANAGE) mới
        thấy các thao tác ghi. "Xác nhận đã thanh toán" kéo dài thêm 1 chu kỳ từ
        mốc hiện tại.
      </p>

      {/* Lock / Unlock */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {s.active ? "Khoá shop" : "Mở khoá shop"}
            </DialogTitle>
            <DialogDescription>
              {s.active
                ? "Khi khoá, chủ shop và nhân viên sẽ không thể đăng nhập hoặc thao tác."
                : "Mở khoá để shop hoạt động trở lại."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lý do (tuỳ chọn)</Label>
            <Textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Ghi chú nội bộ"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant={s.active ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={statusSubmitting}
            >
              {s.active ? "Khoá" : "Mở khoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override subscription status */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi trạng thái subscription</DialogTitle>
            <DialogDescription>
              Cưỡng bức đổi status — dùng khi cần can thiệp. Không ảnh hưởng mốc
              thời gian; để gia hạn hãy dùng nút "Gia hạn" hoặc "Xác nhận đã
              thanh toán".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Status mới</Label>
              <Select
                value={overrideForm.subscriptionStatus}
                onValueChange={(v) =>
                  setOverrideForm((p) => ({ ...p, subscriptionStatus: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lý do</Label>
              <Textarea
                value={overrideForm.reason}
                onChange={(e) =>
                  setOverrideForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Ghi chú nội bộ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOverrideOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={handleOverrideStatus}
              disabled={overrideSubmitting}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gia hạn subscription</DialogTitle>
            <DialogDescription>
              Cộng thêm số tháng vào chu kỳ hiện tại (hoặc bắt đầu chu kỳ mới
              nếu đã hết hạn).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Số tháng gia hạn</Label>
            <Input
              type="number"
              min="1"
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExtendOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleExtendPlan} disabled={extendSubmitting}>
              Gia hạn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark paid */}
      <Dialog open={paidOpen} onOpenChange={setPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đã thanh toán</DialogTitle>
            <DialogDescription>
              Ghi nhận shop đã thanh toán 99.000đ — kéo dài thêm 1 chu kỳ (1
              tháng) từ mốc hiện tại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Gateway</Label>
              <Select
                value={paidForm.gateway}
                onValueChange={(v) =>
                  setPaidForm((p) => ({ ...p, gateway: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATEWAY_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mã giao dịch (tuỳ chọn)</Label>
              <Input
                value={paidForm.transactionId}
                onChange={(e) =>
                  setPaidForm((p) => ({ ...p, transactionId: e.target.value }))
                }
                placeholder="VD: VNPAY-20250402-123"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={paidForm.reason}
                onChange={(e) =>
                  setPaidForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Ghi chú nội bộ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaidOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleMarkPaid} disabled={paidSubmitting}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
