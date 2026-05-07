import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Loader2,
  Landmark,
  Copy,
  QrCode,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscription } from "@/hooks/useSubscription";
import { useShop } from "@/hooks/useShop";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WebSocketMessageTypes } from "@/constants/websocket.js";
import {
  getSubscriptionHistory,
  getSubscriptionTransferInfo,
  startSubscriptionPayment,
  reportSubscriptionManualTransferSent,
  cancelSubscriptionManualTransferPending,
} from "@/api/subscriptionApi";
import { toast } from "sonner";
import { SHOP_ROLE_LABELS } from "@/constants/shopRoles.js";

const GATEWAY_OPTIONS = [
  {
    value: "MANUAL",
    label: "Chuyển khoản — admin xác nhận",
  },
];

/** Push WS từ server khi có thông báo billing (NotificationType). */
const BILLING_REFRESH_WS_TYPES = new Set([
  "BILLING_PAYMENT_SUCCESS",
  "BILLING_PAYMENT_FAILED",
  "BILLING_MANUAL_TRANSFER_PENDING",
]);

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
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/20">
          Đang dùng thử
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
          Đang hoạt động
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">Đã hết hạn</Badge>;
    case "CANCELLED":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700/50">
          Đã huỷ
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status ?? "—"}</Badge>;
  }
}

/**
 * Khi gateway redirect về /billing (VNPay/MoMo — giữ lại cho tương lai).
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

function TransferBlock({ title, info, showCopyContent }) {
  if (!info?.accountNumber) return null;
  const copyContent = () => {
    if (!info.transferContent) return;
    navigator.clipboard.writeText(info.transferContent);
    toast.success("Đã copy nội dung chuyển khoản");
  };
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Landmark className="h-4 w-4" />
        {title}
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Ngân hàng: </span>
          {info.bankName || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Chủ TK: </span>
          {info.accountHolder}
        </div>
        <div className="md:col-span-2">
          <span className="text-muted-foreground">Số TK: </span>
          <span className="font-mono font-semibold">{info.accountNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Số tiền: </span>
          <span className="font-semibold tabular-nums">{fmtVnd(info.amountVnd)}</span>
        </div>
        {info.transferContent ? (
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Nội dung CK: </span>
            <code className="rounded bg-background px-2 py-0.5 text-xs font-mono border">
              {info.transferContent}
            </code>
            {showCopyContent && (
              <Button type="button" variant="outline" size="sm" onClick={copyContent}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {info.qrImageUrl ? (
        <div className="flex flex-col gap-3 border-t pt-3 mt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="h-4 w-4 shrink-0" />
            <span>
              Quét mã QR để chuyển (điền sẵn số tiền / nội dung nếu hỗ trợ)
            </span>
          </div>
          <div className="flex justify-center w-full">
            <img
              src={info.qrImageUrl}
              alt="QR chuyển khoản"
              className="w-full max-w-[360px] aspect-square rounded-lg border bg-white object-contain p-2 shadow-sm"
            />
          </div>
        </div>
      ) : null}
      {info.instructions ? (
        <p className="text-xs text-muted-foreground whitespace-pre-line border-t pt-2">
          {info.instructions}
        </p>
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  const { confirm } = useAlertDialog();
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const { selectedShopId, selectedShop, shops, isShopContextReady } = useShop();
  const needsShopPick =
    isShopContextReady &&
    (shops?.length ?? 0) > 1 &&
    !selectedShopId;
  const { data, loading, refresh } = useSubscription({
    enabled: isShopContextReady && !needsShopPick,
  });
  const [paying, setPaying] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transferPreview, setTransferPreview] = useState(null);
  const [transferPreviewLoading, setTransferPreviewLoading] = useState(true);
  /** Sau khi bấm Thanh toán MANUAL — có mã + QR đầy đủ */
  const [lastPaymentTransfer, setLastPaymentTransfer] = useState(null);
  /** Mã MANUAL vừa tạo trong phiên (trước khi /me kịp có pendingManualProviderTxnRef). */
  const [lastCreatedTxnRef, setLastCreatedTxnRef] = useState(null);
  const [reportingTransfer, setReportingTransfer] = useState(false);
  const [cancellingTransfer, setCancellingTransfer] = useState(false);

  const loadHistory = useCallback(async (opts) => {
    const silent = opts?.silent === true;
    try {
      if (!silent) setHistoryLoading(true);
      const res = await getSubscriptionHistory();
      const items = res?.data?.data ?? res?.data ?? [];
      setHistory(Array.isArray(items) ? items : []);
    } catch {
      setHistory([]);
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isShopContextReady || needsShopPick) return;
    let cancelled = false;
    (async () => {
      try {
        setTransferPreviewLoading(true);
        const res = await getSubscriptionTransferInfo();
        const dto = res?.data?.data ?? res?.data ?? null;
        if (!cancelled) setTransferPreview(dto);
      } catch {
        if (!cancelled) setTransferPreview(null);
      } finally {
        if (!cancelled) setTransferPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedShopId, isShopContextReady, needsShopPick]);

  useEffect(() => {
    if (!isShopContextReady || needsShopPick) return;
    refresh();
    loadHistory();
  }, [selectedShopId, isShopContextReady, needsShopPick, refresh, loadHistory]);

  /** Chủ shop nhận WS /topic/notifications/{userId} khi có thanh toán — làm mới lịch sử ngay. */
  useEffect(() => {
    if (!user?.id || !connected || !isShopContextReady || needsShopPick) return;
    return subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type !== WebSocketMessageTypes.NOTIFICATION || !message.data) return;
      const t = message.data.type;
      if (!BILLING_REFRESH_WS_TYPES.has(t)) return;
      const sid = message.data.shopId;
      if (selectedShopId && sid && sid !== selectedShopId) return;
      refresh(true);
      loadHistory({ silent: true });
    });
  }, [
    user?.id,
    connected,
    subscribe,
    selectedShopId,
    needsShopPick,
    isShopContextReady,
    refresh,
    loadHistory,
  ]);

  /** Đang chờ CK / chờ admin → poll nhanh hơn; còn không → vẫn poll nhẹ để bắt hủy phía admin. */
  const pendingManualRef = data?.pendingManualProviderTxnRef;
  const pendingManualReportedAt = data?.pendingManualShopReportedAt;
  const waitingBillingSync = Boolean(
    pendingManualRef || lastCreatedTxnRef || pendingManualReportedAt,
  );

  useEffect(() => {
    if (!isShopContextReady || needsShopPick) return;
    const intervalMs = waitingBillingSync ? 18000 : 42000;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refresh(true);
      loadHistory({ silent: true });
    }, intervalMs);
    return () => clearInterval(id);
  }, [
    isShopContextReady,
    needsShopPick,
    waitingBillingSync,
    refresh,
    loadHistory,
  ]);

  // Xử lý redirect từ VNPay / MoMo về /billing (nếu bật lại sau này)
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
    refresh(true);
    loadHistory({ silent: true });
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
  }, [refresh, loadHistory]);

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

  const manualRefToReport = pendingManualRef || lastCreatedTxnRef;

  const onCancelPendingManual = async () => {
    if (!manualRefToReport) return;
    const ok = await confirm(
      "Huỷ yêu cầu chuyển khoản đang chờ xác nhận? Sau đó bạn có thể tạo mã thanh toán mới.",
      {
        title: "Huỷ yêu cầu chờ xác nhận",
        confirmText: "Huỷ yêu cầu",
        cancelText: "Đóng",
        variant: "destructive",
      },
    );
    if (!ok) return;
    try {
      setCancellingTransfer(true);
      await cancelSubscriptionManualTransferPending({
        providerTxnRef: manualRefToReport,
      });
      setLastPaymentTransfer(null);
      setLastCreatedTxnRef(null);
      await refresh();
      await loadHistory();
      toast.success("Đã huỷ yêu cầu chờ xác nhận.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Không huỷ được. Thử lại hoặc liên hệ hỗ trợ.",
      );
    } finally {
      setCancellingTransfer(false);
    }
  };

  const onReportTransferSent = async () => {
    if (!manualRefToReport) return;
    try {
      setReportingTransfer(true);
      const res = await reportSubscriptionManualTransferSent({
        providerTxnRef: manualRefToReport,
      });
      if (res?.data?.success === false) {
        toast.error(res?.data?.message || "Không ghi nhận được");
        return;
      }
      setLastCreatedTxnRef(null);
      await refresh();
      await loadHistory();
      toast.success(
        "Đã ghi nhận: bạn đã chuyển khoản. Admin sẽ đối soát và xác nhận sớm nhất.",
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Không ghi nhận được. Thử lại hoặc liên hệ hỗ trợ.",
      );
    } finally {
      setReportingTransfer(false);
    }
  };

  const onPay = async () => {
    try {
      setPaying(true);
      const res = await startSubscriptionPayment({
        gateway: "MANUAL",
        returnUrl: window.location.origin + "/billing",
      });
      const payload = res?.data?.data ?? res?.data;
      if (
        payload?.gateway !== "MANUAL" &&
        payload?.paymentUrl &&
        !payload.paymentUrl.startsWith("/mock-pay")
      ) {
        toast.info("Đang chuyển tới cổng thanh toán…");
        window.location.href = payload.paymentUrl;
        return;
      }
      const instr = payload?.transferInstructions;
      if (instr?.transferContent) {
        setLastPaymentTransfer(instr);
        setLastCreatedTxnRef(payload?.transactionId || null);
        toast.success(
          `Đã tạo mã giao dịch ${payload.transactionId}. Admin đã nhận thông báo — sau khi chuyển khoản, vui lòng chờ xác nhận (thường trong giờ hành chính).`,
        );
      } else {
        setLastPaymentTransfer(null);
        setLastCreatedTxnRef(payload?.transactionId || null);
        toast.success(
          "Đã ghi nhận yêu cầu. Vui lòng chuyển khoản theo thông tin tài khoản — admin đã được thông báo nếu hệ thống cấu hình đủ.",
        );
      }
      await refresh();
      await loadHistory();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Không khởi tạo được thanh toán. Vui lòng thử lại sau.",
      );
    } finally {
      setPaying(false);
    }
  };

  const displayTransfer = lastPaymentTransfer || transferPreview;

  return (
    <div className="w-full p-4 space-y-4 md:max-w-5xl md:mx-auto">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Gói dịch vụ &amp; Thanh toán</h1>
      </div>

      {needsShopPick && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom" />
            Bạn có nhiều shop — hãy <b>chọn shop</b> trên menu (góc trên) để xem và thanh toán
            đúng gói cho từng shop.
          </div>
        )}

      {selectedShop && !needsShopPick && isShopContextReady && (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Thanh toán cho cửa hàng
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-lg font-semibold">{selectedShop.name}</span>
            {selectedShop.role && (
              <Badge variant="outline" className="text-xs font-normal">
                {SHOP_ROLE_LABELS[selectedShop.role] || selectedShop.role}
              </Badge>
            )}
          </div>
          {selectedShop.slug ? (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              /{selectedShop.slug}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground shrink-0">Trạng thái gói:</span>
            {loading && !data ? (
              <span className="text-muted-foreground text-xs">Đang tải…</span>
            ) : data ? (
              <>
                {statusBadge(data.status)}
                {(data.status === "TRIAL" || data.status === "ACTIVE") && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    Còn {remainingDays} ngày
                  </span>
                )}
              </>
            ) : selectedShop.subscriptionStatus != null ? (
              <>
                {statusBadge(selectedShop.subscriptionStatus)}
                {(selectedShop.subscriptionStatus === "TRIAL" ||
                  selectedShop.subscriptionStatus === "ACTIVE") && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    Còn {selectedShop.subscriptionDaysRemaining ?? 0} ngày
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
          {data?.shopId && selectedShop.id && data.shopId !== selectedShop.id ? (
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
              Dữ liệu gói chưa khớp shop đang chọn. Hãy tải lại trang hoặc đổi shop.
            </p>
          ) : null}
        </div>
      )}

      {transferPreviewLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải thông tin chuyển khoản…
        </div>
      ) : displayTransfer?.accountNumber ? (
        <div className="space-y-3">
          <TransferBlock
            title={
              lastPaymentTransfer?.transferContent
                ? "Thanh toán lần này (mã vừa tạo)"
                : "Thông tin chuyển khoản hệ thống"
            }
            info={displayTransfer}
            showCopyContent={!!lastPaymentTransfer?.transferContent}
          />
          {manualRefToReport && !pendingManualReportedAt && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
                <p className="text-sm">
                  Sau khi <b>đã chuyển khoản</b> đúng số tiền và nội dung, hãy bấm nút
                  bên phải để báo admin đối soát — không thay thế xác nhận của admin.
                </p>
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-200 bg-white text-red-800 hover:bg-red-50 hover:text-red-900 dark:border-red-500/40 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/15 dark:hover:text-red-100"
                    disabled={cancellingTransfer || reportingTransfer}
                    onClick={onCancelPendingManual}
                  >
                    {cancellingTransfer ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang huỷ…
                      </>
                    ) : (
                      "Huỷ yêu cầu chờ"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-400"
                    disabled={reportingTransfer || cancellingTransfer}
                    onClick={onReportTransferSent}
                  >
                    {reportingTransfer ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang gửi…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Tôi đã chuyển khoản
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          {pendingManualReportedAt && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
              <div>
                <CheckCircle2 className="inline h-4 w-4 mr-1 align-text-bottom" />
                Đã báo admin lúc {fmtDate(pendingManualReportedAt)}. Vui lòng chờ xác
                nhận (thường trong giờ hành chính).
              </div>
              {manualRefToReport ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-200 bg-white text-red-800 hover:bg-red-50 shrink-0 dark:border-red-500/40 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-500/15"
                  disabled={cancellingTransfer}
                  onClick={onCancelPendingManual}
                >
                  {cancellingTransfer ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang huỷ…
                    </>
                  ) : (
                    "Huỷ chờ xác nhận"
                  )}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom" />
          Chưa cấu hình tài khoản nhận (env{" "}
          <code className="text-xs">BILLING_ACCOUNT_NUMBER</code>,{" "}
          <code className="text-xs">BILLING_ACCOUNT_HOLDER</code>, …). Liên hệ quản trị hệ thống.
        </div>
      )}

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
            thử, phí dịch vụ là <b>99.000đ/tháng</b>. Thanh toán qua{" "}
            <b>chuyển khoản</b> — gói được gia hạn sau khi admin xác nhận đã nhận
            tiền.
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
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-500/10 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Các thao tác ghi (thêm/sửa/xoá đơn, sản phẩm, khách hàng…) đang
                bị khoá. Hãy thanh toán để khôi phục quyền thao tác.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Phương thức:{" "}
            <span className="font-medium text-foreground">
              {GATEWAY_OPTIONS[0].label}
            </span>
          </div>
          <Button
            disabled={paying}
            onClick={onPay}
            className="min-w-[200px] bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {data?.status === "ACTIVE"
              ? "Tạo mã & gia hạn (chuyển khoản 99.000đ)"
              : "Tạo mã thanh toán (chuyển khoản 99.000đ)"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử gói &amp; thanh toán</CardTitle>
          <CardDescription>
            Các thay đổi status, giao dịch thanh toán và thao tác admin (nếu có).
            Khi admin xác nhận, dòng <b>PAYMENT</b> sẽ ghi nhận thời gian và mã
            giao dịch.
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
