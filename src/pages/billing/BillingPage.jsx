import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getSubscriptionHistory,
  startSubscriptionPayment,
} from "@/api/subscriptionApi";
import { toast } from "sonner";

const GATEWAY_OPTIONS = [
  { value: "VNPAY", label: "VNPay" },
  { value: "MOMO", label: "MoMo" },
  { value: "MANUAL", label: "Chuyển khoản / Admin xác nhận" },
];

function fmtVnd(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString("vi-VN") + " ₫";
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function statusBadge(status) {
  switch (status) {
    case "TRIAL":
      return (
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
          Đang dùng thử
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          Đang hoạt động
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">Đã hết hạn</Badge>;
    case "CANCELLED":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
          Đã huỷ
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status ?? "—"}</Badge>;
  }
}

/**
 * Khi gateway redirect về /billing, đọc query string để show toast + refresh.
 * Dùng để detect: vnp_ResponseCode (VNPay), resultCode (MoMo), pay=success (fallback).
 */
function parsePaymentCallback(search) {
  if (!search || search.length <= 1) return null;
  const params = new URLSearchParams(search);
  if (params.has("vnp_ResponseCode")) {
    const code = params.get("vnp_ResponseCode");
    return {
      gateway: "VNPAY",
      success: code === "00",
      code,
      ref: params.get("vnp_TxnRef"),
    };
  }
  if (params.has("resultCode")) {
    const code = params.get("resultCode");
    return {
      gateway: "MOMO",
      success: code === "0",
      code,
      ref: params.get("orderId"),
    };
  }
  if (params.get("pay") === "success") {
    return { gateway: "MANUAL", success: true, code: "0", ref: null };
  }
  return null;
}

export default function BillingPage() {
  const { data, loading, refresh } = useSubscription();
  const [paying, setPaying] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("VNPAY");

  useEffect(() => {
    if (data?.gateway && GATEWAY_OPTIONS.some((o) => o.value === data.gateway)) {
      setSelectedGateway(data.gateway);
    }
  }, [data?.gateway]);

  // Xử lý redirect từ VNPay / MoMo về /billing?vnp_ResponseCode=...
  useEffect(() => {
    const callback = parsePaymentCallback(window.location.search);
    if (!callback) return;
    if (callback.success) {
      toast.success(
        `Thanh toán ${callback.gateway} thành công. Gói dịch vụ sẽ được cập nhật trong ít phút.`,
      );
    } else {
      toast.error(
        `Thanh toán ${callback.gateway} thất bại (mã ${callback.code}). Vui lòng thử lại hoặc chọn phương thức khác.`,
      );
    }
    refresh();
    const url = new URL(window.location.href);
    const keysToStrip = [
      "vnp_Amount", "vnp_BankCode", "vnp_BankTranNo", "vnp_CardType",
      "vnp_OrderInfo", "vnp_PayDate", "vnp_ResponseCode", "vnp_TmnCode",
      "vnp_TransactionNo", "vnp_TransactionStatus", "vnp_TxnRef",
      "vnp_SecureHash", "vnp_SecureHashType",
      "partnerCode", "orderId", "requestId", "amount", "orderInfo",
      "orderType", "transId", "resultCode", "message", "payType",
      "responseTime", "extraData", "signature",
      "pay",
    ];
    keysToStrip.forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setHistoryLoading(true);
        const res = await getSubscriptionHistory();
        const items = res?.data?.data ?? res?.data ?? [];
        if (!cancelled) setHistory(Array.isArray(items) ? items : []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const keyDate = useMemo(() => {
    if (!data) return null;
    if (data.status === "TRIAL") return data.trialEndsAt;
    if (data.status === "ACTIVE") return data.currentPeriodEnd;
    return null;
  }, [data]);

  const remainingDays =
    data?.status === "TRIAL"
      ? data.trialDaysRemaining
      : data?.status === "ACTIVE"
        ? data.periodDaysRemaining
        : 0;

  const onPay = async () => {
    try {
      setPaying(true);
      const res = await startSubscriptionPayment({
        gateway: selectedGateway,
        returnUrl: window.location.origin + "/billing",
      });
      const payload = res?.data?.data ?? res?.data;
      if (
        selectedGateway !== "MANUAL" &&
        payload?.paymentUrl &&
        !payload.paymentUrl.startsWith("/mock-pay")
      ) {
        toast.info("Đang chuyển tới cổng thanh toán…");
        window.location.href = payload.paymentUrl;
        return;
      }
      toast.success(
        "Đã ghi nhận yêu cầu thanh toán thủ công. Vui lòng chuyển khoản theo hướng dẫn của admin — gói sẽ được kích hoạt sau khi admin xác nhận.",
      );
      refresh();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Không khởi tạo được thanh toán. Vui lòng thử lại sau.",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Gói dịch vụ &amp; Thanh toán</h1>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">Trạng thái hiện tại</CardTitle>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              statusBadge(data?.status)
            )}
          </div>
          <CardDescription>
            Mỗi shop được dùng thử miễn phí <b>30 ngày</b>. Sau thời gian dùng
            thử, phí dịch vụ là <b>99.000đ/tháng</b>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoStat
              icon={<Clock className="h-4 w-4" />}
              label={
                data?.status === "TRIAL"
                  ? "Còn lại (dùng thử)"
                  : data?.status === "ACTIVE"
                    ? "Còn lại (chu kỳ hiện tại)"
                    : "Số ngày còn lại"
              }
              value={
                data?.status === "EXPIRED" || data?.status === "CANCELLED"
                  ? "0 ngày"
                  : `${remainingDays ?? 0} ngày`
              }
              sub={keyDate ? `Hết hạn ${fmtDate(keyDate)}` : null}
            />
            <InfoStat
              icon={<Receipt className="h-4 w-4" />}
              label="Phí định kỳ"
              value={fmtVnd(data?.amountVnd ?? 99000)}
              sub="VND / tháng"
            />
            <InfoStat
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Thanh toán gần nhất"
              value={data?.lastPaymentAt ? fmtDate(data.lastPaymentAt) : "—"}
              sub={data?.lastPaymentTransactionId || null}
            />
          </div>

          {(data?.status === "EXPIRED" || data?.status === "CANCELLED") && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-800 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Các thao tác ghi (thêm/sửa/xoá đơn, sản phẩm, khách hàng…) đang
                bị khoá. Hãy thanh toán để khôi phục quyền thao tác.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Phương thức:
            </span>
            <Select
              value={selectedGateway}
              onValueChange={setSelectedGateway}
              disabled={paying}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {GATEWAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={paying} onClick={onPay} className="min-w-[180px]">
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {data?.status === "ACTIVE"
              ? "Gia hạn thêm 1 tháng"
              : "Thanh toán 99.000đ"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử gói &amp; thanh toán</CardTitle>
          <CardDescription>
            Các thay đổi status, giao dịch thanh toán và thao tác admin (nếu có).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải lịch sử…
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có giao dịch nào.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Chu kỳ</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Mã giao dịch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {fmtDate(h.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">{h.actionType}</TableCell>
                      <TableCell className="text-sm">
                        {h.durationMonths ? `${h.durationMonths} tháng` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {h.paymentMethod || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {h.transactionId || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoStat({ icon, label, value, sub }) {
  return (
    <div className="rounded-md border p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {sub ? (
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      ) : null}
    </div>
  );
}
