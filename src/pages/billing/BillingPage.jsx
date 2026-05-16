import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
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
import { getShopRoleLabel } from "@/utils/shopLabels";

/** Push WS từ server khi có thông báo billing (NotificationType). */
const BILLING_REFRESH_WS_TYPES = new Set([
  "BILLING_PAYMENT_SUCCESS",
  "BILLING_PAYMENT_FAILED",
  "BILLING_MANUAL_TRANSFER_PENDING",
]);

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

function statusBadge(status, t) {
  const text = status
    ? t(`pages.billing.status.${status}`, { defaultValue: status })
    : "—";
  switch (status) {
    case "TRIAL":
      return (
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/20">
          {text}
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
          {text}
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">{text}</Badge>;
    case "CANCELLED":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700/50">
          {text}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{text}</Badge>;
  }
}

function TransferBlock({ title, info, showCopyContent }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  const fmtVndLocal = (v) => {
    if (v == null) return "—";
    return Number(v).toLocaleString(numberLocale) + " ₫";
  };

  if (!info?.accountNumber) return null;

  const amountFormatted = fmtVndLocal(info.amountVnd);
  const instructionText = info.transferContent
    ? t("pages.billing.transfer.instructionsPayment", {
        amount: amountFormatted,
        content: info.transferContent,
      })
    : t("pages.billing.transfer.instructionsStatic", {
        amount: amountFormatted,
        perMonth: t("pages.billing.transfer.perMonthShort"),
      });

  const copyContent = () => {
    if (!info.transferContent) return;
    navigator.clipboard.writeText(info.transferContent);
    toast.success(t("pages.billing.transfer.copySuccess"));
  };
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Landmark className="h-4 w-4" />
        {title}
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-muted-foreground">{t("pages.billing.transfer.bank")} </span>
          {info.bankName || "—"}
        </div>
        <div>
          <span className="text-muted-foreground">{t("pages.billing.transfer.accountHolder")} </span>
          {info.accountHolder}
        </div>
        <div className="md:col-span-2">
          <span className="text-muted-foreground">{t("pages.billing.transfer.accountNumber")} </span>
          <span className="font-mono font-semibold">{info.accountNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("pages.billing.transfer.amount")} </span>
          <span className="font-semibold tabular-nums">{fmtVndLocal(info.amountVnd)}</span>
        </div>
        {info.transferContent ? (
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{t("pages.billing.transfer.transferContent")} </span>
            <code className="rounded bg-background px-2 py-0.5 text-xs font-mono border">
              {info.transferContent}
            </code>
            {showCopyContent && (
              <Button type="button" variant="outline" size="sm" onClick={copyContent}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                {t("pages.billing.transfer.copy")}
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {info.qrImageUrl ? (
        <div className="flex flex-col gap-3 border-t pt-3 mt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="h-4 w-4 shrink-0" />
            <span>{t("pages.billing.transfer.qrHint")}</span>
          </div>
          <div className="flex justify-center w-full">
            <img
              src={info.qrImageUrl}
              alt={t("pages.billing.transfer.qrAlt")}
              className="w-full max-w-[360px] aspect-square rounded-lg border bg-white object-contain p-2 shadow-sm"
            />
          </div>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground whitespace-pre-line border-t pt-2">
        {instructionText}
      </p>
    </div>
  );
}

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const dateLocale = numberLocale;

  const fmtVnd = useCallback(
    (v) => {
      if (v == null) return "—";
      return Number(v).toLocaleString(numberLocale) + " ₫";
    },
    [numberLocale],
  );

  const fmtDate = useCallback(
    (iso) => {
      if (!iso) return "—";
      try {
        return new Date(iso).toLocaleString(dateLocale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return String(iso);
      }
    },
    [dateLocale],
  );

  const gatewayOptions = useMemo(
    () => [{ value: "MANUAL", label: t("pages.billing.gateway.manual") }],
    [t],
  );

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
      const msgType = message.data.type;
      if (!BILLING_REFRESH_WS_TYPES.has(msgType)) return;
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
        t("pages.billing.toast.paymentSuccess", { gateway: callback.gateway }),
      );
    } else {
      toast.error(
        t("pages.billing.toast.paymentFail", {
          gateway: callback.gateway,
          code: callback.code,
        }),
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
  }, [refresh, loadHistory, t]);

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
      t("pages.billing.toast.cancelConfirm"),
      {
        title: t("pages.billing.toast.cancelTitle"),
        confirmText: t("pages.billing.toast.cancelConfirmBtn"),
        cancelText: t("pages.billing.toast.cancelClose"),
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
      toast.success(t("pages.billing.toast.cancelSuccess"));
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          t("pages.billing.toast.cancelFail"),
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
        toast.error(res?.data?.message || t("pages.billing.toast.reportFail"));
        return;
      }
      setLastCreatedTxnRef(null);
      await refresh();
      await loadHistory();
      toast.success(t("pages.billing.toast.reportSuccess"));
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          t("pages.billing.toast.reportFailGeneric"),
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
        toast.info(t("pages.billing.toast.redirecting"));
        window.location.href = payload.paymentUrl;
        return;
      }
      const instr = payload?.transferInstructions;
      if (instr?.transferContent) {
        setLastPaymentTransfer(instr);
        setLastCreatedTxnRef(payload?.transactionId || null);
        toast.success(
          t("pages.billing.toast.txnCreated", { id: payload.transactionId }),
        );
      } else {
        setLastPaymentTransfer(null);
        setLastCreatedTxnRef(payload?.transactionId || null);
        toast.success(t("pages.billing.toast.requestRecorded"));
      }
      await refresh();
      await loadHistory();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          t("pages.billing.toast.payInitFail"),
      );
    } finally {
      setPaying(false);
    }
  };

  const displayTransfer = lastPaymentTransfer || transferPreview;

  const transferTitle = lastPaymentTransfer?.transferContent
    ? t("pages.billing.transfer.thisPayment")
    : t("pages.billing.transfer.systemInfo");

  const daysLabelKey =
    data?.status === "TRIAL"
      ? "pages.billing.currentStatus.trialRemaining"
      : data?.status === "ACTIVE"
        ? "pages.billing.currentStatus.activeRemaining"
        : "pages.billing.currentStatus.daysRemainingLabel";

  return (
    <div className="w-full p-4 space-y-4 md:max-w-5xl md:mx-auto">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">{t("pages.billing.title")}</h1>
      </div>

      {needsShopPick && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom" />
            <Trans i18nKey="pages.billing.pickShopWarning" components={{ b: <b /> }} />
          </div>
        )}

      {selectedShop && !needsShopPick && isShopContextReady && (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("pages.billing.payingForShop")}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-lg font-semibold">{selectedShop.name}</span>
            {selectedShop.role && (
              <Badge variant="outline" className="text-xs font-normal">
                {getShopRoleLabel(t, selectedShop.role) || selectedShop.role}
              </Badge>
            )}
          </div>
          {selectedShop.slug ? (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              /{selectedShop.slug}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground shrink-0">{t("pages.billing.packageStatus")}</span>
            {loading && !data ? (
              <span className="text-muted-foreground text-xs">{t("pages.billing.loading")}</span>
            ) : data ? (
              <>
                {statusBadge(data.status, t)}
                {(data.status === "TRIAL" || data.status === "ACTIVE") && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("pages.billing.daysRemaining", { count: remainingDays })}
                  </span>
                )}
              </>
            ) : selectedShop.subscriptionStatus != null ? (
              <>
                {statusBadge(selectedShop.subscriptionStatus, t)}
                {(selectedShop.subscriptionStatus === "TRIAL" ||
                  selectedShop.subscriptionStatus === "ACTIVE") && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("pages.billing.daysRemaining", {
                      count: selectedShop.subscriptionDaysRemaining ?? 0,
                    })}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
          {data?.shopId && selectedShop.id && data.shopId !== selectedShop.id ? (
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
              {t("pages.billing.dataMismatch")}
            </p>
          ) : null}
        </div>
      )}

      {transferPreviewLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("pages.billing.loadingTransfer")}
        </div>
      ) : displayTransfer?.accountNumber ? (
        <div className="space-y-3">
          <TransferBlock
            title={transferTitle}
            info={displayTransfer}
            showCopyContent={!!lastPaymentTransfer?.transferContent}
          />
          {manualRefToReport && !pendingManualReportedAt && (
              <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
                <p className="text-sm">
                  <Trans i18nKey="pages.billing.reportTransfer.hint" components={{ b: <b /> }} />
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
                        {t("pages.billing.reportTransfer.cancelling")}
                      </>
                    ) : (
                      t("pages.billing.reportTransfer.cancelPending")
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
                        {t("pages.billing.reportTransfer.sending")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t("pages.billing.reportTransfer.iTransferred")}
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
                {t("pages.billing.reportTransfer.reportedAt", {
                  date: fmtDate(pendingManualReportedAt),
                })}
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
                      {t("pages.billing.reportTransfer.cancelling")}
                    </>
                  ) : (
                    t("pages.billing.reportTransfer.cancelWaiting")
                  )}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{t("pages.billing.currentStatus.title")}</CardTitle>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              statusBadge(data?.status, t)
            )}
          </div>
          <CardDescription className="space-y-1">
            <Trans i18nKey="pages.billing.currentStatus.description" components={{ b: <b /> }} />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoStat
              icon={<Clock className="h-4 w-4" />}
              label={t(daysLabelKey)}
              value={
                data?.status === "EXPIRED" || data?.status === "CANCELLED"
                  ? t("pages.billing.daysUnit", { count: 0 })
                  : t("pages.billing.daysUnit", { count: remainingDays ?? 0 })
              }
              sub={keyDate ? t("pages.billing.expiresAt", { date: fmtDate(keyDate) }) : null}
            />
            <InfoStat
              icon={<Receipt className="h-4 w-4" />}
              label={t("pages.billing.currentStatus.recurringFee")}
              value={fmtVnd(data?.amountVnd ?? 99000)}
              sub={t("pages.billing.vndPerMonth")}
            />
            <InfoStat
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={t("pages.billing.currentStatus.lastPayment")}
              value={data?.lastPaymentAt ? fmtDate(data.lastPaymentAt) : "—"}
              sub={data?.lastPaymentTransactionId || null}
            />
          </div>

          {(data?.status === "EXPIRED" || data?.status === "CANCELLED") && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-800 text-sm dark:bg-red-500/10 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                {t("pages.billing.currentStatus.lockedWarning")}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("pages.billing.currentStatus.paymentMethod")}{" "}
            <span className="font-medium text-foreground">
              {gatewayOptions[0].label}
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
              ? t("pages.billing.currentStatus.payActive")
              : t("pages.billing.currentStatus.payDefault")}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pages.billing.history.title")}</CardTitle>
          <CardDescription>
            <Trans i18nKey="pages.billing.history.description" components={{ b: <b /> }} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("pages.billing.loadingHistory")}
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("pages.billing.history.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pages.billing.history.colTime")}</TableHead>
                    <TableHead>{t("pages.billing.history.colAction")}</TableHead>
                    <TableHead>{t("pages.billing.history.colPeriod")}</TableHead>
                    <TableHead>{t("pages.billing.history.colMethod")}</TableHead>
                    <TableHead>{t("pages.billing.history.colTxnId")}</TableHead>
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
                        {h.durationMonths
                          ? t("pages.billing.monthsUnit", { count: h.durationMonths })
                          : "—"}
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
