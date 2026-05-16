import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ShoppingCart,
  Loader2,
  MoreHorizontal,
  CreditCard,
  XCircle,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  Receipt,
  Search,
  Filter,
  Plus,
  Percent,
  Pencil,
  ImagePlus,
  ChevronDown,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { useBranchChannel } from "../../hooks/useBranchChannel.js";
import { useShopChannel } from "../../hooks/useShopChannel.js";
import { useWebSocket } from "../../hooks/useWebSocket.js";
import { useRealtimePollFallback } from "../../hooks/useRealtimePollFallback.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";
import { PERM } from "../../constants/shopPermissions.js";
import { SHOP_INDUSTRY } from "../../constants/ShopIndustry.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { getTables } from "../../api/tableApi.js";
import { PosInvoiceReceipt } from "../../components/pos/PosInvoiceReceipt.jsx";
import { printPosInvoiceReceipt } from "../../components/pos/printPosInvoiceReceipt.jsx";
import { resolveInvoiceLocale } from "../../utils/invoiceLocale.js";
import { getInvoiceT } from "../../utils/invoiceI18n.js";
import { getPaymentMethodLabel } from "../../utils/posHelpers.js";
import {
  getOrders,
  filterOrders,
  cancelOrder,
  confirmPayment,
  uploadOrderPaymentProof,
  updateOrderStatus,
  patchOrderFulfillment,
} from "../../api/orderApi.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import CreateOrderModal from "./CreateOrderModal";
import {
  orderLineAttributesLabel,
  orderLineToppings,
  orderLineVariantLabel,
} from "../../utils/orderItemDisplay.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUS_META = {
  PENDING: {
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40",
  },
  CONFIRMED: {
    icon: CheckCircle2,
    cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/40",
  },
  SHIPPING: {
    icon: Truck,
    cls: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/40",
  },
  COMPLETED: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40",
  },
  CANCELLED: {
    icon: Ban,
    cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/40",
  },
};

const PAYMENT_METHOD_VALUES = ["Cash", "Card", "Transfer"];

/** Mã đơn hàng hiển thị (API: orderCode); đơn cũ có thể chỉ có id. */
function displayOrderCode(order) {
  const code = order?.orderCode?.trim();
  if (code) return code;
  const id = order?.id;
  if (!id) return "—";
  return id.length > 10
    ? `DH-${id.slice(-8).toUpperCase()}`
    : String(id).toUpperCase();
}

function orderHasGuestInfo(order) {
  return !!(order?.guestName?.trim() || order?.guestPhone?.trim());
}

function orderHasCrmCustomerInfo(order) {
  return !!(
    order?.customerName?.trim() ||
    order?.customerPhone?.trim() ||
    order?.customerId
  );
}

/** Có dòng thuế / tổng thuế > 0 trên snapshot đơn. */
function orderHasPositiveTax(tax) {
  if (!tax) return false;
  const total = tax.taxTotal ?? 0;
  if (total > 0.005) return true;
  return (tax.taxes || []).some((l) => (l.amount ?? 0) > 0.005);
}

function fmtVndInt(v, locale = "vi-VN") {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString(locale) + " ₫";
}

function orderTaxSummaryTooltip(order, tr, locale = "vi-VN") {
  const tax = order.taxSnapshot;
  if (!tax) {
    return tr("pages.orders.tax.noSnapshotLong");
  }
  const lines = [
    tax.priceIncludesTax
      ? tr("pages.orders.tax.policyIncludes")
      : tr("pages.orders.tax.policyExcludes"),
    tr("pages.orders.tax.subtotalBase", {
      amount: fmtVndInt(tax.netAmount ?? 0, locale),
    }),
  ];
  if (orderHasPositiveTax(tax)) {
    lines.push(
      tr("pages.orders.tax.taxTotal", {
        amount: fmtVndInt(tax.taxTotal ?? 0, locale),
      }),
    );
    (tax.taxes || []).forEach((x) => {
      if ((x.amount ?? 0) > 0.005) {
        lines.push(
          tr("pages.orders.tax.taxLine", {
            label: x.label,
            amount: fmtVndInt(x.amount ?? 0, locale),
          }),
        );
      }
    });
  } else {
    lines.push(tr("pages.orders.tax.noTaxOnOrder"));
  }
  lines.push(
    tr("pages.orders.tax.grandTotal", {
      amount: fmtVndInt(tax.grandTotal ?? order.totalPrice ?? 0, locale),
    }),
  );
  return lines.join("\n");
}

function shortId(id) {
  if (!id) return "";
  const s = String(id);
  return s.length > 10 ? s.slice(-8).toUpperCase() : s.toUpperCase();
}

function OrderTaxBadge({ order }) {
  const { t: tr, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const tax = order.taxSnapshot;
  if (!tax) {
    return (
      <span
        className="text-[11px] text-muted-foreground tabular-nums"
        title={tr("pages.orders.tax.noSnapshotTitle")}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        —
      </span>
    );
  }
  const has = orderHasPositiveTax(tax);
  return (
    <Badge
      variant={has ? "default" : "secondary"}
      className={
        has
          ? "text-[10px] gap-0.5 font-normal bg-sky-600 text-white hover:bg-sky-600/90 border-0 cursor-help"
          : "text-[10px] font-normal cursor-help"
      }
      title={orderTaxSummaryTooltip(order, tr, numberLocale)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Percent className="h-3 w-3 opacity-90" />
      {has ? tr("pages.orders.tax.hasTax") : tr("pages.orders.tax.noTax")}
    </Badge>
  );
}

function PaymentCollectionBadge({ paid, paymentStatus }) {
  const { t: tr } = useTranslation();
  if (paid) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40">
        <CreditCard className="h-3 w-3" /> {tr("pages.orders.payment.paid")}
      </Badge>
    );
  }
  if (paymentStatus === "PENDING_COLLECTION") {
    return (
      <Badge className="gap-1 text-[11px] bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40">
        <Truck className="h-3 w-3" /> {tr("pages.orders.payment.pendingCod")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] gap-1">
      {tr("pages.orders.payment.unpaid")}
    </Badge>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const OrderStatusBadge = ({ status }) => {
  const { t: tr } = useTranslation();
  const cfg = ORDER_STATUS_META[status] || { icon: Clock, cls: "" };
  const IconComp = cfg.icon;
  const label = tr(`pages.orders.status.${status}`, { defaultValue: status });
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {label}
    </Badge>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, iconClassName, loading }) => {
  const IconComp = icon;
  return (
    <Card className="py-4 gap-3">
      <CardContent className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${iconClassName}`}
        >
          <IconComp className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold tracking-tight leading-none">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {label}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Order Detail Dialog ─────────────────────────────────────────────────────

const OrderDetailDialog = ({
  open,
  onClose,
  order,
  shopId,
  canEdit,
  canUploadPaymentProof,
  onSaved,
  onOrderPatched,
}) => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const [saving, setSaving] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);
  const proofFileRef = useRef(null);
  const [form, setForm] = useState({
    note: "",
    customerId: "",
    guestName: "",
    guestPhone: "",
    shippingCarrier: "",
    shippingMethod: "",
    trackingNumber: "",
    externalOrderRef: "",
  });

  useEffect(() => {
    if (!order) return;
    setForm({
      note: order.note ?? "",
      customerId: order.customerId ?? "",
      guestName: order.guestName ?? "",
      guestPhone: order.guestPhone ?? "",
      shippingCarrier: order.shippingCarrier ?? "",
      shippingMethod: order.shippingMethod ?? "",
      trackingNumber: order.trackingNumber ?? "",
      externalOrderRef: order.externalOrderRef ?? "",
    });
  }, [order]);

  const handleSaveFulfillment = async () => {
    if (!order || !shopId) return;
    setSaving(true);
    try {
      // Backend: null = không đổi; chuỗi (kể cả rỗng) = cập nhật / xóa giá trị.
      const payload = {
        note: form.note.trim(),
        customerId: form.customerId.trim(),
        guestName: form.guestName.trim(),
        guestPhone: form.guestPhone.trim(),
        shippingCarrier: form.shippingCarrier.trim(),
        shippingMethod: form.shippingMethod.trim(),
        trackingNumber: form.trackingNumber.trim(),
        externalOrderRef: form.externalOrderRef.trim(),
      };
      const res = await patchOrderFulfillment(order.id, shopId, payload);
      const updated = res.data?.data;
      toast.success(t("pages.orders.detail.saveSuccess"));
      if (updated && onOrderPatched) onOrderPatched(updated);
      onSaved?.();
    } catch (e) {
      toast.error(
        e.response?.data?.message || t("pages.orders.detail.saveFail"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentProofSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !order?.id || !shopId) return;
    setProofUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadOrderPaymentProof(order.id, shopId, fd);
      const updated = res.data?.data;
      toast.success(t("pages.orders.detail.proofUploadSuccess"));
      if (updated && onOrderPatched) onOrderPatched(updated);
      onSaved?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("pages.orders.detail.proofUploadFail"),
      );
    } finally {
      setProofUploading(false);
    }
  };

  if (!order) return null;
  const customerIdUnchanged =
    (form.customerId || "").trim() === (order.customerId || "").trim();
  const showCrmCustomerSummary =
    orderHasCrmCustomerInfo(order) && (!canEdit || customerIdUnchanged);
  const showGuestSummary = orderHasGuestInfo(order);
  const tax = order.taxSnapshot;
  const itemLineQty = (i) =>
    i?.sellByWeight ? Number(i?.weight ?? 0) : (i?.quantity ?? 0);
  const itemsSubtotal = (order.items ?? []).reduce(
    (s, i) => s + (i.priceAfterDiscount ?? i.price ?? 0) * itemLineQty(i),
    0,
  );
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t("pages.orders.detail.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.orders.detail.orderCode")}{" "}
            <span className="font-mono text-foreground">
              {displayOrderCode(order)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentCollectionBadge
              paid={order.paid}
              paymentStatus={order.paymentStatus}
            />
          </div>

          {showCrmCustomerSummary && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-[11px] text-muted-foreground mb-0.5">
                {t("pages.orders.detail.crmCustomer")}
              </p>
              <span className="font-medium">
                {order.customerName?.trim() || "—"}
              </span>
              {order.customerPhone && (
                <span className="text-muted-foreground">
                  {" "}
                  · {order.customerPhone}
                </span>
              )}
              {order.customerId && (
                <span className="block text-[11px] font-mono text-muted-foreground mt-0.5">
                  ID: {order.customerId}
                </span>
              )}
            </div>
          )}

          {showGuestSummary && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-[11px] text-muted-foreground mb-0.5">
                {t("pages.orders.detail.guestCustomer")}
              </p>
              {order.guestName?.trim() ? (
                <p>
                  <span className="text-muted-foreground">
                    {t("pages.orders.detail.name")}{" "}
                  </span>
                  <span className="font-medium">{order.guestName.trim()}</span>
                </p>
              ) : null}
              {order.guestPhone?.trim() ? (
                <p>
                  <span className="text-muted-foreground">
                    {t("pages.orders.detail.phone")}{" "}
                  </span>
                  <span className="font-mono">{order.guestPhone.trim()}</span>
                </p>
              ) : null}
            </div>
          )}

          {!canEdit &&
            (order.note ||
              order.shippingCarrier ||
              order.shippingMethod ||
              order.trackingNumber ||
              order.externalOrderRef) && (
              <details
                className="group rounded-md border open:bg-background"
                key={`ro-fulfill-${order.id}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-muted/40 rounded-md [&::-webkit-details-marker]:hidden">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("pages.orders.detail.shippingSection")}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t px-3 py-2 space-y-1 text-sm">
                {order.note && (
                  <p>
                    <span className="text-muted-foreground">
                      {t("pages.orders.detail.note")}{" "}
                    </span>
                    {order.note}
                  </p>
                )}
                {order.externalOrderRef && (
                  <p>
                    <span className="text-muted-foreground">
                      {t("pages.orders.detail.externalRef")}{" "}
                    </span>
                    <span className="font-mono">{order.externalOrderRef}</span>
                  </p>
                )}
                {order.shippingMethod && (
                  <p>
                    <span className="text-muted-foreground">
                      {t("pages.orders.detail.shippingMethod")}{" "}
                    </span>
                    {order.shippingMethod}
                  </p>
                )}
                {order.shippingCarrier && (
                  <p>
                    <span className="text-muted-foreground">
                      {t("pages.orders.detail.carrier")}{" "}
                    </span>
                    {order.shippingCarrier}
                  </p>
                )}
                {order.trackingNumber && (
                  <p>
                    <span className="text-muted-foreground">
                      {t("pages.orders.detail.tracking")}{" "}
                    </span>
                    <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                )}
                </div>
              </details>
            )}

          {canEdit && (
            <details
              className="group rounded-md border open:bg-background"
              key={`ed-fulfill-${order.id}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-muted/40 rounded-md [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 text-left">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("pages.orders.detail.shippingSection")}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground leading-snug">
                    {t("pages.orders.detail.editHint")}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("pages.orders.detail.noteLabel")}</Label>
                <Textarea
                  className="text-sm min-h-[56px]"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t("pages.orders.detail.customerIdLabel")}
                </Label>
                <Input
                  className="h-8 text-sm font-mono"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerId: e.target.value }))
                  }
                  placeholder={t("pages.orders.detail.customerIdPlaceholder")}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("pages.orders.detail.customerIdHint")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.guestNameLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.guestName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestName: e.target.value }))
                    }
                    placeholder={t("pages.orders.detail.guestNamePlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.guestPhoneLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm font-mono"
                    value={form.guestPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestPhone: e.target.value }))
                    }
                    placeholder={t("pages.orders.detail.guestPhonePlaceholder")}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.externalRefLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.externalOrderRef}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        externalOrderRef: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.shippingMethodLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.shippingMethod}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shippingMethod: e.target.value }))
                    }
                    placeholder={t("pages.orders.detail.shippingMethodPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.carrierLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.shippingCarrier}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        shippingCarrier: e.target.value,
                      }))
                    }
                    placeholder={t("pages.orders.detail.carrierPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t("pages.orders.detail.trackingLabel")}
                  </Label>
                  <Input
                    className="h-8 text-sm font-mono"
                    value={form.trackingNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, trackingNumber: e.target.value }))
                    }
                  />
                </div>
              </div>
              </div>
            </details>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.orders.detail.product")}</TableHead>
                  <TableHead className="text-right">
                    {t("pages.orders.detail.qty")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("pages.orders.detail.unitPrice")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("pages.orders.detail.lineTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item, idx) => {
                  const basePrice = item.price ?? 0;
                  const unitAfter = item.priceAfterDiscount ?? item.price ?? 0;
                  const showOrig = Math.abs(basePrice - unitAfter) > 0.009;
                  const isWeight = !!item.sellByWeight;
                  const lineMultiplier = isWeight
                    ? Number(item.weight ?? 0)
                    : (item.quantity ?? 0);
                  const lineTotal = unitAfter * lineMultiplier;
                  const qtyDisplay = isWeight
                    ? `${Number(item.weight ?? 0).toLocaleString(numberLocale, {
                        maximumFractionDigits: 3,
                      })} ${item.weightUnit || ""}`.trim()
                    : item.quantity;
                  const promoBits = [
                    item.promotionName,
                    item.promotionDiscountLabel,
                  ].filter(Boolean);
                  const variantLabel = orderLineVariantLabel(item);
                  const attrLabel = orderLineAttributesLabel(item);
                  const tops = orderLineToppings(item);
                  const showAttr =
                    attrLabel && attrLabel !== (item.variantName || "").trim();
                  return (
                    <TableRow key={idx} className="align-top">
                      <TableCell className="text-sm max-w-[220px]">
                        <p className="font-medium leading-snug">
                          {item.productName}
                        </p>
                        {variantLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {variantLabel}
                          </p>
                        )}
                        {showAttr && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("pages.orders.detail.attributes")} {attrLabel}
                          </p>
                        )}
                        {tops.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {tops.map((t, ti) => (
                              <p key={t?.toppingId ?? ti}>
                                + {t?.name || t?.toppingId}
                                {Number(t?.extraPrice) > 0
                                  ? ` (${Number(t.extraPrice).toLocaleString(numberLocale)} ₫)`
                                  : ""}
                              </p>
                            ))}
                          </div>
                        )}
                        {promoBits.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {t("pages.orders.detail.promo")}{" "}
                              {promoBits.join(" · ")}
                            </Badge>
                          </div>
                        )}
                        {!item.promotionName &&
                          !item.promotionDiscountLabel &&
                          item.appliedPromotionId &&
                          promoBits.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("pages.orders.detail.promoMissing")}{" "}
                              <span className="font-mono">
                                {item.appliedPromotionId.length > 10
                                  ? item.appliedPromotionId.slice(-8)
                                  : item.appliedPromotionId}
                              </span>
                            </p>
                          )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        {qtyDisplay}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums align-top">
                        {showOrig && (
                          <span className="line-through text-muted-foreground text-xs block">
                            {basePrice.toLocaleString(numberLocale)} ₫
                            {isWeight && item.weightUnit
                              ? `/${item.weightUnit}`
                              : ""}
                          </span>
                        )}
                        <span>
                          {unitAfter.toLocaleString(numberLocale)} ₫
                          {isWeight && item.weightUnit
                            ? `/${item.weightUnit}`
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums align-top">
                        {lineTotal.toLocaleString(numberLocale)} ₫
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {order.pointsDiscount > 0 && (
            <div className="rounded-md border border-dashed px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("pages.orders.detail.itemsSubtotal")}
                </span>
                <span className="tabular-nums">
                  {itemsSubtotal.toLocaleString(numberLocale)} ₫
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>
                  {t("pages.orders.detail.pointsDiscount")}
                  {order.pointsRedeemed
                    ? t("pages.orders.detail.pointsCount", {
                        points: order.pointsRedeemed,
                      })
                    : ""}
                </span>
                <span className="tabular-nums">
                  −{order.pointsDiscount.toLocaleString(numberLocale)} ₫
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/30 px-3 py-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">
                {t("pages.orders.tax.paymentAndTax")}
              </span>
              {tax && (
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0 font-normal border-sky-300/80 dark:border-sky-700"
                >
                  {t("pages.orders.tax.snapshotAtOrder")}
                </Badge>
              )}
            </div>

            {tax ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tax.priceIncludesTax
                    ? t("pages.orders.tax.includesTaxHint")
                    : t("pages.orders.tax.excludesTaxHint")}
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {tax.priceIncludesTax
                      ? t("pages.orders.tax.netIncludesVat")
                      : t("pages.orders.tax.netExcludesTax")}
                  </span>
                  <span className="tabular-nums font-medium">
                    {fmtVndInt(tax.netAmount ?? 0, numberLocale)}
                  </span>
                </div>
                {(tax.taxes || []).map((taxLine, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>
                      {taxLine.label}
                      {(taxLine.rate ?? 0) > 0
                        ? ` (${(taxLine.rate * 100).toFixed(0)}%)`
                        : ""}
                    </span>
                    <span className="tabular-nums">
                      {fmtVndInt(taxLine.amount ?? 0, numberLocale)}
                    </span>
                  </div>
                ))}
                {!orderHasPositiveTax(tax) && (
                  <p className="text-xs text-muted-foreground italic">
                    {t("pages.orders.tax.noTaxLines")}
                  </p>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("pages.orders.tax.taxTotalLabel")}</span>
                  <span className="tabular-nums">
                    {fmtVndInt(tax.taxTotal ?? 0, numberLocale)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-sky-200/90 dark:border-sky-800/60">
                  <span>{t("pages.orders.tax.grandTotalLabel")}</span>
                  <span className="tabular-nums text-sky-900 dark:text-sky-100">
                    {fmtVndInt(tax.grandTotal ?? order.totalPrice ?? 0, numberLocale)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("pages.orders.tax.noSnapshotDetail")}
                </p>
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>{t("pages.orders.tax.totalLabel")}</span>
                  <span className="tabular-nums">
                    {fmtVndInt(order.totalPrice ?? 0, numberLocale)}
                  </span>
                </div>
              </>
            )}
          </div>

          {order.paymentMethod && (
            <div className="text-sm text-muted-foreground">
              {t("pages.orders.detail.paymentLabel")} {order.paymentMethod}
              {order.paymentTime &&
                ` — ${new Date(order.paymentTime).toLocaleString(numberLocale)}`}
            </div>
          )}

          {order.paid &&
            (order.paymentMethod === "Transfer" ||
              order.paymentProofImageUrl) && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("pages.orders.detail.proofTitle")}
                </p>
                {order.paymentProofImageUrl ? (
                  <a
                    href={order.paymentProofImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={order.paymentProofImageUrl}
                      alt={t("pages.orders.detail.proofAlt")}
                      className="max-h-44 w-auto rounded-md border object-contain bg-muted/20"
                    />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {t("pages.orders.detail.proofEmpty")}
                  </p>
                )}
                {canUploadPaymentProof ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={proofFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePaymentProofSelected}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      disabled={proofUploading}
                      onClick={() => proofFileRef.current?.click()}
                    >
                      {proofUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      {order.paymentProofImageUrl
                        ? t("pages.orders.detail.proofReplace")
                        : t("pages.orders.detail.proofAdd")}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
        </div>

        {canEdit && order.status !== "CANCELLED" && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pages.orders.detail.close")}
            </Button>
            <Button
              type="button"
              onClick={handleSaveFulfillment}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {t("pages.orders.detail.save")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const OrderListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    selectedShopId,
    selectedShop,
    selectedIndustry,
    selectedBranchId,
    selectedBranch,
    branches,
    setSelectedBranchId,
  } = useShop();
  const { hasShopPermission } = useShopPermissions();

  const shopHasTableManagement = selectedIndustry === SHOP_INDUSTRY.FNB;
  const { confirm } = useAlertDialog();
  const canUpdate = hasShopPermission(PERM.ORDER_UPDATE);
  const canCancel = hasShopPermission(PERM.ORDER_CANCEL);
  const canPay = hasShopPermission(PERM.ORDER_PAYMENT_CONFIRM);

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payingOrderSnapshot, setPayingOrderSnapshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState(null);

  // Branch deeplink: /orders?branchId=...
  useEffect(() => {
    const bid = searchParams.get("branchId");
    if (!bid) return;
    if (!Array.isArray(branches) || branches.length === 0) return;
    const ok = branches.some((b) => b.id === bid);
    if (!ok) return;
    if (selectedBranchId === bid) return;
    setSelectedBranchId(bid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, branches]);

  const effectiveBranchId = useMemo(
    () => selectedBranchId ?? (branches.length === 1 ? branches[0]?.id : null),
    [selectedBranchId, branches],
  );

  // Load tables để hiển thị tên bàn — chỉ shop FNB (có màn Quản lý bàn)
  useEffect(() => {
    if (!shopHasTableManagement || !selectedShopId || !effectiveBranchId) {
      setTables([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await getTables(selectedShopId, effectiveBranchId, {
          size: 1000,
        });
        const data = res.data?.data;
        const list =
          data?.content ?? (Array.isArray(data) ? data : data ? [data] : []);
        if (alive) setTables(Array.isArray(list) ? list : []);
      } catch {
        if (alive) setTables([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [shopHasTableManagement, selectedShopId, effectiveBranchId]);

  const tableNameById = useMemo(() => {
    const map = new Map();
    (tables || []).forEach((t) => {
      if (t?.id) map.set(t.id, t.name || t.code || t.label || null);
    });
    return map;
  }, [tables]);

  const openInvoiceDialog = useCallback(
    (order) => {
      if (!order) return;
      const bid = order.branchId || effectiveBranchId;
      const br =
        (bid ? branches.find((b) => b.id === bid) : null) ||
        (selectedBranch?.id === bid ? selectedBranch : null);
      const branchName = br?.name || selectedBranch?.name || null;
      const tableName = order.tableId ? tableNameById.get(order.tableId) : null;
      const invoiceLocale = resolveInvoiceLocale(br);
      const invoiceT = getInvoiceT(invoiceLocale);
      const pmLabel = order.paymentMethod
        ? getPaymentMethodLabel(invoiceT, order.paymentMethod)
        : null;
      setInvoicePayload({
        invoiceLocale,
        shopName: selectedShop?.name || selectedShop?.shopName || null,
        shopAddress: selectedShop?.address || null,
        shopPhone: selectedShop?.phone || null,
        branchName,
        branchWifiSsid: br?.wifiSsid || null,
        branchWifiPassword: br?.wifiPassword || null,
        order,
        customerName: order.customerName || null,
        tableName,
        paymentMethodLabel: pmLabel,
        printedAt: new Date().toISOString(),
      });
      setInvoiceOpen(true);
    },
    [
      selectedShop,
      selectedBranch,
      branches,
      effectiveBranchId,
      tableNameById,
      t,
    ],
  );

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { connected: wsConnected } = useWebSocket();

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!selectedShopId) return;
    if (!silent) setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sort: "createdAt,desc",
      };
      if (effectiveBranchId) params.branchId = effectiveBranchId;

      const res =
        statusFilter === "ALL"
          ? await getOrders(selectedShopId, params)
          : await filterOrders(selectedShopId, statusFilter, params);

      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setOrders(data.content ?? []);
        setTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        setTotalCount(list.length);
      }
    } catch {
      if (!silent) toast.error(t("pages.orders.list.fetchError"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedShopId, effectiveBranchId, pagination, statusFilter, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useRealtimePollFallback({
    enabled: !!selectedShopId,
    connected: wsConnected,
    onPoll: () => fetchOrders({ silent: true }),
  });

  // ── Realtime: subscribe kênh order của shop+branch đang chọn ─────────────
  const onRealtimeOrder = useCallback(
    (msg) => {
      if (!msg?.type) return;
      const t = msg.type;
      const payload = msg.data;

      const matchesStatusFilter = (order) =>
        statusFilter === "ALL" || order?.status === statusFilter;

      if (t === WebSocketMessageTypes.ORDER_CREATED) {
        if (!payload?.id) return;
        if (!matchesStatusFilter(payload)) return;
        setOrders((prev) => {
          if (prev.some((o) => o.id === payload.id)) return prev;
          // Chỉ prepend ở trang đầu để không phá vỡ phân trang;
          // các trang khác sẽ nhận qua refetch định kỳ / thao tác của user.
          if (pagination.pageIndex !== 0) return prev;
          return [payload, ...prev].slice(0, pagination.pageSize);
        });
        setTotalCount((c) => c + 1);
        return;
      }

      if (
        t === WebSocketMessageTypes.ORDER_UPDATED ||
        t === WebSocketMessageTypes.ORDER_STATUS_CHANGED ||
        t === WebSocketMessageTypes.PAYMENT_SUCCEEDED
      ) {
        if (!payload?.id) return;
        setOrders((prev) => {
          let removedFromList = false;
          const next = prev
            .map((o) => (o.id === payload.id ? { ...o, ...payload } : o))
            .filter((o) => {
              if (o.id !== payload.id) return true;
              if (!matchesStatusFilter(o)) {
                removedFromList = true;
                return false;
              }
              return true;
            });
          if (removedFromList) setTotalCount((c) => Math.max(0, c - 1));
          return next;
        });
        setSelectedOrder((cur) =>
          cur?.id === payload.id ? { ...cur, ...payload } : cur,
        );
        return;
      }

      if (t === WebSocketMessageTypes.ORDER_DELETED) {
        const removedId = payload?.id || payload;
        if (!removedId) return;
        setOrders((prev) => {
          if (!prev.some((o) => o.id === removedId)) return prev;
          setTotalCount((c) => Math.max(0, c - 1));
          return prev.filter((o) => o.id !== removedId);
        });
      }
    },
    [statusFilter, pagination.pageIndex, pagination.pageSize],
  );
  useBranchChannel("orders", onRealtimeOrder, { branchId: effectiveBranchId });

  // ── Realtime: kênh shop-level cho đơn online (storefront) ──────────────────
  // Đơn online có thể không khớp branch hiện tại — luôn refetch để badge online
  // và stat hiển thị chính xác trên trang đang xem.
  const onOnlineOrderEvent = useCallback(
    (msg) => {
      if (msg?.type !== WebSocketMessageTypes.ONLINE_ORDER_CREATED) return;
      const code = msg?.data?.orderCode || msg?.data?.orderId || "";
      const customer =
        msg?.data?.customerName || t("pages.orders.list.onlineOrderGuest");
      toast.info(t("pages.orders.list.onlineOrderToast", { code }), {
        description: t("pages.orders.list.onlineOrderDesc", {
          customer,
          phone: msg?.data?.customerPhone
            ? ` · ${msg.data.customerPhone}`
            : "",
        }),
      });
      // Refetch trang đầu để đơn mới xuất hiện đúng vị trí.
      if (pagination.pageIndex === 0) {
        fetchOrders();
      } else {
        setTotalCount((c) => c + 1);
      }
    },
    [fetchOrders, pagination.pageIndex, t],
  );
  useShopChannel("orders/online", onOnlineOrderEvent);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const revenue = orders
      .filter((o) => o.paid)
      .reduce(
        (sum, o) => sum + (o.taxSnapshot?.grandTotal ?? o.totalPrice ?? 0),
        0,
      );
    return { total, pending, completed, revenue };
  }, [orders]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleCancel = useCallback(
    async (order) => {
      const ok = await confirm(t("pages.orders.list.cancelConfirm"), {
        title: t("pages.orders.list.cancelTitle"),
        confirmText: t("pages.orders.list.cancelConfirmBtn"),
        cancelText: t("pages.orders.list.close"),
        variant: "destructive",
      });
      if (!ok) return;
      try {
        setSubmitting(true);
        await cancelOrder(order.id, selectedShopId);
        toast.success(t("pages.orders.list.cancelSuccess"));
        fetchOrders();
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("pages.orders.list.cancelFail"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [confirm, selectedShopId, fetchOrders, t],
  );

  const handleStatusChange = useCallback(
    async (order, newStatus) => {
      try {
        setSubmitting(true);
        await updateOrderStatus(order.id, selectedShopId, newStatus);
        toast.success(
          t("pages.orders.list.statusUpdated", {
            status: t(`pages.orders.status.${newStatus}`, {
              defaultValue: newStatus,
            }),
          }),
        );
        fetchOrders();
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("pages.orders.list.statusUpdateFail"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedShopId, fetchOrders, t],
  );

  const openPaymentDialog = useCallback((order) => {
    setPayingOrderSnapshot(order);
    setPayingOrderId(order.id);
    setPaymentMethod("Cash");
    setPaymentProofFile(null);
    setPaymentDialogOpen(true);
  }, []);

  const goEditOrderOnPos = useCallback(
    (order) => {
      const q = new URLSearchParams();
      if (order.orderCode) {
        q.set("orderCode", order.orderCode);
      } else {
        q.set("orderId", order.id);
      }
      navigate(`/pos?${q.toString()}`);
    },
    [navigate],
  );

  const handleConfirmPayment = async () => {
    if (!payingOrderId) return;
    try {
      setSubmitting(true);
      const paymentId = `PAY-${Date.now()}`;
      await confirmPayment(
        payingOrderId,
        selectedShopId,
        paymentId,
        paymentMethod,
      );
      if (
        paymentMethod === "Transfer" &&
        paymentProofFile &&
        payingOrderId
      ) {
        try {
          const fd = new FormData();
          fd.append("file", paymentProofFile);
          await uploadOrderPaymentProof(payingOrderId, selectedShopId, fd);
        } catch (upErr) {
          console.error(upErr);
          toast.warning(t("pages.orders.list.paymentProofWarning"));
        }
      }
      toast.success(t("pages.orders.list.paymentSuccess"));
      setPaymentDialogOpen(false);
      setPayingOrderSnapshot(null);
      setPayingOrderId(null);
      setPaymentProofFile(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("pages.orders.list.paymentConfirmFail"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const tableColumn = {
      id: "table",
      header: t("pages.orders.list.colTable"),
      enableSorting: false,
      cell: ({ row }) => {
        const tableId = row.original?.tableId;
        if (!tableId) return <span className="text-muted-foreground">—</span>;
        const name = tableNameById.get(tableId);
        return (
          <div className="max-w-[140px]">
            <p className="text-sm font-medium truncate">
              {name ||
                t("pages.orders.list.tableFallback", {
                  id: shortId(tableId),
                })}
            </p>
            {name && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {shortId(tableId)}
              </p>
            )}
          </div>
        );
      },
    };

    return [
      {
        accessorKey: "orderCode",
        header: t("pages.orders.list.colOrderCode"),
        cell: ({ row }) => {
          const o = row.original;
          const isOnline = (o?.orderSource || "").toUpperCase() === "ONLINE";
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono text-muted-foreground">
                {displayOrderCode(o)}
              </span>
              {isOnline && (
                <Badge
                  className="text-[10px] gap-0.5 px-1.5 py-0 h-4 bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/40"
                  title={t("pages.orders.list.onlineBadgeTitle")}
                >
                  <Globe className="h-2.5 w-2.5" />
                  {t("pages.orders.list.onlineBadge")}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.orders.list.colTime")}
          />
        ),
        cell: ({ row }) => {
          const d = row.original.createdAt;
          if (!d) return "—";
          const date = new Date(d);
          return (
            <div>
              <p className="text-sm">{date.toLocaleDateString(numberLocale)}</p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleTimeString(numberLocale)}
              </p>
            </div>
          );
        },
      },
      ...(shopHasTableManagement ? [tableColumn] : []),
      {
        id: "customerGuest",
        header: t("pages.orders.list.colCustomer"),
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original;
          const crm = [o.customerName?.trim(), o.customerPhone?.trim()]
            .filter(Boolean)
            .join(" · ");
          const guest = [o.guestName?.trim(), o.guestPhone?.trim()]
            .filter(Boolean)
            .join(" · ");
          if (!crm && !guest) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="max-w-[220px]">
              {crm ? (
                <p className="text-sm font-medium truncate" title={crm}>
                  {crm}
                </p>
              ) : null}
              {guest ? (
                <p
                  className={`text-xs truncate ${crm ? "text-muted-foreground" : "text-sm font-medium"}`}
                  title={guest}
                >
                  {crm ? t("pages.orders.list.posGuestPrefix") : ""}
                  {guest}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "items",
        header: t("pages.orders.list.colProducts"),
        enableSorting: false,
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          if (items.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="max-w-[200px]">
              <p className="text-sm font-medium truncate">
                {items[0].productName}
              </p>
              {items.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {t("pages.orders.list.moreProducts", {
                    count: items.length - 1,
                  })}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "totalQuantity",
        header: t("pages.orders.list.colQty"),
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          const qty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
          return (
            <span className="text-sm tabular-nums">
              {Number.isFinite(qty) ? qty : 0}
            </span>
          );
        },
      },
      {
        id: "taxSnapshot",
        header: t("pages.orders.list.colTax"),
        enableSorting: false,
        cell: ({ row }) => <OrderTaxBadge order={row.original} />,
      },
      {
        accessorKey: "totalPrice",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.orders.list.colTotal")}
          />
        ),
        cell: ({ row }) => {
          const total =
            row.original.taxSnapshot?.grandTotal ??
            row.original.totalPrice ??
            0;
          return (
            <span className="text-sm font-semibold tabular-nums">
              {total.toLocaleString(numberLocale)} ₫
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("pages.orders.list.colStatus"),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "paid",
        header: t("pages.orders.list.colPayment"),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="flex flex-col gap-1 items-start">
              <PaymentCollectionBadge
                paid={o.paid}
                paymentStatus={o.paymentStatus}
              />
              {o.paymentMethod && (
                <span className="text-[10px] text-muted-foreground max-w-[140px] truncate">
                  {o.paymentMethod}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const order = row.original;
          const isTerminal =
            order.status === "CANCELLED" || order.status === "COMPLETED";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("pages.orders.list.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                <DropdownMenuLabel>{t("pages.orders.list.actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setDetailOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> {t("pages.orders.list.viewDetail")}
                </DropdownMenuItem>

                {!order.paid && !isTerminal && canUpdate && (
                  <DropdownMenuItem onClick={() => goEditOrderOnPos(order)}>
                    <Pencil className="h-4 w-4 mr-2 text-primary" />
                    {t("pages.orders.list.editOnPos")}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => openInvoiceDialog(order)}
                  disabled={!order?.items || order.items.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />{" "}
                  {t("pages.orders.list.reprintBill")}
                </DropdownMenuItem>

                {!order.paid && !isTerminal && canPay && (
                  <DropdownMenuItem onClick={() => openPaymentDialog(order)}>
                    <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    {t("pages.orders.list.pay")}
                  </DropdownMenuItem>
                )}

                {order.status === "PENDING" && canUpdate && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "CONFIRMED")}
                    disabled={submitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />{" "}
                    {t("pages.orders.list.confirm")}
                  </DropdownMenuItem>
                )}

                {order.status === "CONFIRMED" && canUpdate && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "SHIPPING")}
                    disabled={submitting}
                  >
                    <Truck className="h-4 w-4 mr-2 text-violet-600" />{" "}
                    {t("pages.orders.list.ship")}
                  </DropdownMenuItem>
                )}

                {(order.status === "SHIPPING" ||
                  order.status === "CONFIRMED") &&
                  canUpdate && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(order, "COMPLETED")}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                      {t("pages.orders.list.complete")}
                    </DropdownMenuItem>
                  )}

                {!order.paid && !isTerminal && canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                      onClick={() => handleCancel(order)}
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" />{" "}
                      {t("pages.orders.list.cancelOrder")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [
    shopHasTableManagement,
    canUpdate,
    canCancel,
    canPay,
    submitting,
    handleCancel,
    handleStatusChange,
    openPaymentDialog,
    goEditOrderOnPos,
    tableNameById,
    openInvoiceDialog,
    t,
    numberLocale,
  ]);

  // Client-side filter theo nguồn đơn (POS / ONLINE). BE chưa hỗ trợ
  // filter ở query nên áp ngay trên page hiện tại — phù hợp MVP.
  const displayedOrders = useMemo(() => {
    if (sourceFilter === "ALL") return orders;
    return orders.filter((o) => {
      const src = (o?.orderSource || "POS").toUpperCase();
      return src === sourceFilter;
    });
  }, [orders, sourceFilter]);

  const table = useReactTable({
    data: displayedOrders,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, pagination, columnVisibility, rowSelection },
  });

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("pages.orders.list.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pages.orders.list.subtitle")}
            </p>
          </div>
          {/* {canManage && (
            <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo đơn hàng
            </Button>
          )} */}
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={ShoppingCart}
            label={t("pages.orders.list.stats.total")}
            value={stats.total}
            iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={Clock}
            label={t("pages.orders.list.stats.pending")}
            value={stats.pending}
            iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CheckCircle2}
            label={t("pages.orders.list.stats.completed")}
            value={stats.completed}
            iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CreditCard}
            label={t("pages.orders.list.stats.revenue")}
            value={stats.revenue.toLocaleString(numberLocale) + " ₫"}
            iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
            loading={loading && orders.length === 0}
          />
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[170px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">
                  {t("pages.orders.list.filterAllStatus")}
                </SelectItem>
                {Object.keys(ORDER_STATUS_META).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`pages.orders.status.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(v) => setSourceFilter(v)}
            >
              <SelectTrigger className="w-[150px]">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">
                  {t("pages.orders.list.filterAllSource")}
                </SelectItem>
                <SelectItem value="POS">
                  {t("pages.orders.list.sourcePos")}
                </SelectItem>
                <SelectItem value="ONLINE">
                  {t("pages.orders.list.sourceOnline")}
                </SelectItem>
              </SelectContent>
            </Select>
            {branches.length > 1 && (
              <Select
                value={selectedBranchId ?? "ALL"}
                onValueChange={(v) =>
                  setSelectedBranchId(v === "ALL" ? null : v)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue
                    placeholder={t("pages.orders.list.allBranches")}
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ALL">
                    {t("pages.orders.list.allBranches")}
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DataTableViewOptions table={table} />
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-md border">
          {loading && orders.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("pages.orders.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(row.original);
                      setDetailOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={(e) => {
                          const cid = cell.column.id;
                          if (cid === "actions" || cid === "taxSnapshot") {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2 py-4">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                      <p>{t("pages.orders.list.empty")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      {/* ── Detail Dialog ─────────────────────────────────────────── */}
      <OrderDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
        shopId={selectedShopId}
        canEdit={canUpdate}
        canUploadPaymentProof={canPay}
        onSaved={fetchOrders}
        onOrderPatched={(o) => setSelectedOrder(o)}
      />

      {/* ── Payment Confirmation Dialog ───────────────────────────── */}
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(v) => {
          if (!v) {
            setPaymentDialogOpen(false);
            setPayingOrderSnapshot(null);
            setPayingOrderId(null);
            setPaymentProofFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />{" "}
              {t("pages.orders.paymentDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {payingOrderSnapshot?.paymentStatus === "PENDING_COLLECTION"
                ? t("pages.orders.paymentDialog.codHint")
                : t("pages.orders.paymentDialog.defaultHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={paymentMethod}
              onValueChange={(v) => {
                setPaymentMethod(v);
                if (v !== "Transfer") setPaymentProofFile(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {PAYMENT_METHOD_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`pages.orders.paymentMethod.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentMethod === "Transfer" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("pages.orders.paymentDialog.proofLabel")}
                </Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setPaymentProofFile(e.target.files?.[0] ?? null)
                  }
                  className="text-xs cursor-pointer"
                />
                {paymentProofFile && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {paymentProofFile.name}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={submitting}
              >
                {t("pages.orders.paymentDialog.cancel")}
              </Button>
              <Button onClick={handleConfirmPayment} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                {t("pages.orders.paymentDialog.confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reprint Invoice Dialog ─────────────────────────────────── */}
      <Dialog
        open={invoiceOpen}
        onOpenChange={(open) => {
          setInvoiceOpen(open);
          if (!open) setInvoicePayload(null);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              {t("pages.orders.invoice.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.orders.invoice.description")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 max-h-[55vh] px-6">
            <div className="pb-4">
              {invoicePayload?.order ? (
                <PosInvoiceReceipt {...invoicePayload} />
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setInvoiceOpen(false);
                setInvoicePayload(null);
              }}
            >
              {t("pages.orders.invoice.close")}
            </Button>
            <Button
              onClick={() => {
                if (!invoicePayload?.order) return;
                printPosInvoiceReceipt({
                  ...invoicePayload,
                  isDraft: false,
                });
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              {t("pages.orders.invoice.print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateOrderModal
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onCreated={fetchOrders}
      />
    </div>
  );
};

export default OrderListPage;
