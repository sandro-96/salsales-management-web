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
  LayoutGrid,
  List,
} from "lucide-react";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import {
  readOrdersBranchFilter,
  writeOrdersBranchFilter,
} from "../../utils/ordersBranchFilterStorage.js";
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
  countOnlinePendingOrders,
  countPosPendingOrders,
  cancelOrder,
  confirmPayment,
  uploadOrderPaymentProof,
  updateOrderStatus,
  patchOrderFulfillment,
} from "../../api/orderApi.js";
import {
  isProductImageFile,
  prepareProductImageFile,
  PRODUCT_IMAGE_ACCEPT,
} from "@/utils/productImageFiles.js";

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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import CreateOrderModal from "./CreateOrderModal";
import {
  orderLineAttributesLabel,
  orderLineToppings,
  orderLineVariantLabel,
} from "../../utils/orderItemDisplay.js";

import {
  displayOrderCode,
  shortId,
  fmtVndInt,
  orderHasPositiveTax,
  orderHasGuestInfo,
  orderHasCrmCustomerInfo,
  ORDER_STATUS_META,
  OrderStatusBadge,
  PaymentCollectionBadge,
  OrderTaxBadge,
} from "./orderListUi.jsx";
import { OrderListCard, OrderListCardSkeleton } from "./OrderListCard.jsx";

const ORDERS_LIST_VIEW_KEY = "orders-list-view";

function readOrdersListView() {
  try {
    const v = localStorage.getItem(ORDERS_LIST_VIEW_KEY);
    return v === "cards" ? "cards" : "table";
  } catch {
    return "table";
  }
}

const PAYMENT_METHOD_VALUES = ["Cash", "Card", "Transfer"];

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, valueTitle, iconClassName, loading }) => {
  const IconComp = icon;
  const displayTitle =
    valueTitle ??
    (typeof value === "string" || typeof value === "number" ? String(value) : undefined);

  return (
    <Card className="py-0 gap-0 overflow-hidden min-w-0">
      <CardContent
        className={cn(
          "p-2.5 sm:p-4",
          "flex flex-col items-center justify-center gap-1 text-center min-w-0",
          "sm:flex-row sm:items-center sm:gap-3 sm:text-left",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl",
            iconClassName,
          )}
        >
          <IconComp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </div>
        <div className="min-w-0 w-full sm:flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <Skeleton className="h-5 w-14 sm:h-6 sm:w-16" />
              <Skeleton className="h-2.5 w-16 sm:h-3 sm:w-24" />
            </div>
          ) : (
            <>
              <p
                className="text-base sm:text-2xl font-bold tabular-nums tracking-tight leading-tight max-w-full"
                title={displayTitle}
              >
                {value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate max-w-full leading-tight">
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
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw || !order?.id || !shopId) return;
    if (!isProductImageFile(raw)) {
      toast.error(t("pages.products.form.imageTypeError"));
      return;
    }
    setProofUploading(true);
    try {
      const file = await prepareProductImageFile(raw);
      const fd = new FormData();
      fd.append("file", file, file.name || "payment-proof.jpg");
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
                      accept={PRODUCT_IMAGE_ACCEPT}
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
  const { user } = useAuth();
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
  const ordersFilterShopRef = useRef(null);

  const shopHasTableManagement = selectedIndustry === SHOP_INDUSTRY.FNB;
  const { confirm } = useAlertDialog();
  const canCreate = hasShopPermission(PERM.ORDER_CREATE);
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
  const [listView, setListView] = useState(readOrdersListView);

  const setListViewPersisted = useCallback((view) => {
    setListView(view);
    try {
      localStorage.setItem(ORDERS_LIST_VIEW_KEY, view);
    } catch {
      /* ignore */
    }
  }, []);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  /** Lọc chi nhánh trên trang đơn — với ONLINE mặc định ALL (mọi CN). */
  const [ordersBranchFilter, setOrdersBranchFilter] = useState("ALL");
  const [onlinePendingCount, setOnlinePendingCount] = useState(0);
  const [posPendingCount, setPosPendingCount] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const handlePaymentProofDialogFile = async (e) => {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) {
      setPaymentProofFile(null);
      return;
    }
    if (!isProductImageFile(raw)) {
      toast.error(t("pages.products.form.imageTypeError"));
      return;
    }
    try {
      setPaymentProofFile(await prepareProductImageFile(raw));
    } catch {
      toast.error(t("pages.products.form.imageTypeError"));
      setPaymentProofFile(null);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payingOrderSnapshot, setPayingOrderSnapshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState(null);

  const setOrdersBranchFilterPersisted = useCallback(
    (value) => {
      setOrdersBranchFilter(value);
      if (selectedShopId && user?.id && value) {
        writeOrdersBranchFilter(String(user.id), selectedShopId, value);
      }
    },
    [selectedShopId, user?.id],
  );

  // Deeplink + ghi nhớ lọc chi nhánh (localStorage theo user + shop)
  useEffect(() => {
    if (!selectedShopId || !user?.id || !Array.isArray(branches)) return;

    const src = searchParams.get("source");
    if (src === "ONLINE" || src === "IN_STORE" || src === "POS") {
      setSourceFilter(src === "IN_STORE" ? "ONLINE" : src);
    }

    const urlBranch = searchParams.get("branchId");
    if (urlBranch && branches.some((b) => b.id === urlBranch)) {
      setOrdersBranchFilterPersisted(urlBranch);
      ordersFilterShopRef.current = selectedShopId;
      if (src !== "ONLINE" && src !== "IN_STORE") {
        setSelectedBranchId(urlBranch);
      }
      return;
    }

    if (ordersFilterShopRef.current === selectedShopId) return;
    ordersFilterShopRef.current = selectedShopId;
    const saved = readOrdersBranchFilter(user.id, selectedShopId, branches);
    setOrdersBranchFilterPersisted(saved);
  }, [
    searchParams,
    branches,
    selectedShopId,
    user?.id,
    setSelectedBranchId,
    setOrdersBranchFilterPersisted,
  ]);

  const effectiveBranchId = useMemo(
    () => selectedBranchId ?? (branches.length === 1 ? branches[0]?.id : null),
    [selectedBranchId, branches],
  );

  const branchNameById = useMemo(() => {
    const map = new Map();
    (branches || []).forEach((b) => {
      if (b?.id) map.set(b.id, b.name);
    });
    return map;
  }, [branches]);

  const showOnlineBranchColumn =
    sourceFilter === "ONLINE" && branches.length > 1;

  const applySourceFilter = useCallback(
    (next) => {
      setSourceFilter(next);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
      const params = new URLSearchParams();
      if (next === "ONLINE") params.set("source", "ONLINE");
      else if (next === "POS") params.set("source", "POS");
      if (
        ordersBranchFilter &&
        ordersBranchFilter !== "ALL" &&
        branches.length > 1
      ) {
        params.set("branchId", ordersBranchFilter);
      }
      const q = params.toString();
      navigate(q ? `/orders?${q}` : "/orders", { replace: true });
    },
    [navigate, ordersBranchFilter, branches.length],
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

  const listBranchIdForFetch = useMemo(() => {
    if (ordersBranchFilter && ordersBranchFilter !== "ALL") {
      return ordersBranchFilter;
    }
    if (branches.length === 1) return branches[0]?.id ?? null;
    return null;
  }, [ordersBranchFilter, branches]);

  const fetchSourcePendingCounts = useCallback(async () => {
    if (!selectedShopId) return;
    const branchParams = listBranchIdForFetch
      ? { branchId: listBranchIdForFetch }
      : {};
    try {
      const [onlineRes, posRes] = await Promise.all([
        countOnlinePendingOrders(selectedShopId, branchParams),
        countPosPendingOrders(selectedShopId, branchParams),
      ]);
      const onlineData = onlineRes.data?.data;
      const posData = posRes.data?.data;
      setOnlinePendingCount(
        onlineData?.page?.totalElements ?? onlineData?.totalElements ?? 0,
      );
      setPosPendingCount(
        posData?.page?.totalElements ?? posData?.totalElements ?? 0,
      );
    } catch {
      setOnlinePendingCount(0);
      setPosPendingCount(0);
    }
  }, [selectedShopId, listBranchIdForFetch]);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!selectedShopId) return;
    if (!silent) setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sort: "createdAt,desc",
      };

      if (sourceFilter === "ONLINE") {
        params.orderSource = "ONLINE";
        if (ordersBranchFilter && ordersBranchFilter !== "ALL") {
          params.branchId = ordersBranchFilter;
        }
      } else {
        if (sourceFilter === "POS") params.orderSource = "POS";
        if (listBranchIdForFetch) params.branchId = listBranchIdForFetch;
      }

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
  }, [
    selectedShopId,
    listBranchIdForFetch,
    ordersBranchFilter,
    pagination,
    statusFilter,
    sourceFilter,
    t,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSourcePendingCounts();
  }, [fetchSourcePendingCounts]);

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

      const refreshPendingBadges = () => fetchSourcePendingCounts();

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
        refreshPendingBadges();
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
        refreshPendingBadges();
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
        refreshPendingBadges();
      }
    },
    [
      statusFilter,
      pagination.pageIndex,
      pagination.pageSize,
      fetchSourcePendingCounts,
    ],
  );
  useBranchChannel("orders", onRealtimeOrder, { branchId: effectiveBranchId });

  // ── Realtime: kênh shop-level cho đơn online (storefront) ──────────────────
  // Đơn online có thể không khớp branch hiện tại — luôn refetch để badge online
  // và stat hiển thị chính xác trên trang đang xem.
  const onOnlineOrderEvent = useCallback(
    (msg) => {
      if (msg?.type !== WebSocketMessageTypes.ONLINE_ORDER_CREATED) return;
      fetchSourcePendingCounts();
      if (sourceFilter === "ONLINE") {
        if (pagination.pageIndex === 0) {
          fetchOrders({ silent: true });
        } else {
          setTotalCount((c) => c + 1);
        }
      }
    },
    [fetchOrders, fetchSourcePendingCounts, pagination.pageIndex, sourceFilter],
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
        fetchSourcePendingCounts();
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("pages.orders.list.cancelFail"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [confirm, selectedShopId, fetchOrders, fetchSourcePendingCounts, t],
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
        fetchSourcePendingCounts();
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("pages.orders.list.statusUpdateFail"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedShopId, fetchOrders, fetchSourcePendingCounts, t],
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
          fd.append(
            "file",
            paymentProofFile,
            paymentProofFile.name || "payment-proof.jpg",
          );
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
      fetchSourcePendingCounts();
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("pages.orders.list.paymentConfirmFail"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderOrderActions = useCallback(
    (order, { Item, Label, Separator, variant }) => {
      const isTerminal =
        order.status === "CANCELLED" || order.status === "COMPLETED";
      const act = (handler) =>
        variant === "context"
          ? { onSelect: () => handler() }
          : { onClick: () => handler() };

      return (
        <>
          <Label>{t("pages.orders.list.actions")}</Label>
          <Separator />
          <Item
            {...act(() => {
              setSelectedOrder(order);
              setDetailOpen(true);
            })}
          >
            <Eye className="h-4 w-4 mr-2" /> {t("pages.orders.list.viewDetail")}
          </Item>

          {!order.paid && !isTerminal && canUpdate && (
            <Item {...act(() => goEditOrderOnPos(order))}>
              <Pencil className="h-4 w-4 mr-2 text-primary" />
              {t("pages.orders.list.editOnPos")}
            </Item>
          )}

          <Item
            {...act(() => openInvoiceDialog(order))}
            disabled={!order?.items || order.items.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />{" "}
            {t("pages.orders.list.reprintBill")}
          </Item>

          {!order.paid && !isTerminal && canPay && (
            <Item {...act(() => openPaymentDialog(order))}>
              <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />{" "}
              {t("pages.orders.list.pay")}
            </Item>
          )}

          {order.status === "PENDING" && canUpdate && (
            <Item
              {...act(() => handleStatusChange(order, "CONFIRMED"))}
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />{" "}
              {t("pages.orders.list.confirm")}
            </Item>
          )}

          {order.status === "CONFIRMED" && canUpdate && (
            <Item
              {...act(() => handleStatusChange(order, "SHIPPING"))}
              disabled={submitting}
            >
              <Truck className="h-4 w-4 mr-2 text-violet-600" />{" "}
              {t("pages.orders.list.ship")}
            </Item>
          )}

          {(order.status === "SHIPPING" || order.status === "CONFIRMED") &&
            canUpdate && (
              <Item
                {...act(() => handleStatusChange(order, "COMPLETED"))}
                disabled={submitting}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                {t("pages.orders.list.complete")}
              </Item>
            )}

          {!order.paid && !isTerminal && canCancel && (
            <>
              <Separator />
              <Item
                className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                {...act(() => handleCancel(order))}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-2" />{" "}
                {t("pages.orders.list.cancelOrder")}
              </Item>
            </>
          )}
        </>
      );
    },
    [
      t,
      canUpdate,
      canCancel,
      canPay,
      submitting,
      handleCancel,
      handleStatusChange,
      openPaymentDialog,
      goEditOrderOnPos,
      openInvoiceDialog,
    ],
  );

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

    const branchColumn = {
      id: "branch",
      header: t("pages.orders.list.colBranch"),
      enableSorting: false,
      cell: ({ row }) => {
        const bid = row.original?.branchId;
        if (!bid) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm truncate max-w-[120px] block">
            {branchNameById.get(bid) || shortId(bid)}
          </span>
        );
      },
    };

    return [
      {
        accessorKey: "orderCode",
        header: t("pages.orders.list.colOrderCode"),
        cell: ({ row }) => {
          const o = row.original;
          const source = (o?.orderSource || "").toUpperCase();
          const isOnline = source === "ONLINE";
          const isInStore = source === "IN_STORE";
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
              {isInStore && (
                <Badge
                  className="text-[10px] gap-0.5 px-1.5 py-0 h-4 bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/40"
                  title={t("pages.orders.list.inStoreBadgeTitle")}
                >
                  {t("pages.orders.list.inStoreBadge")}
                </Badge>
              )}
            </div>
          );
        },
      },
      ...(showOnlineBranchColumn ? [branchColumn] : []),
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
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">{t("pages.orders.list.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                {renderOrderActions(order, {
                  Item: DropdownMenuItem,
                  Label: DropdownMenuLabel,
                  Separator: DropdownMenuSeparator,
                  variant: "dropdown",
                })}
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
    renderOrderActions,
    showOnlineBranchColumn,
    branchNameById,
    t,
    numberLocale,
  ]);

  // POS: lọc client trên trang hiện tại; ONLINE: đã lọc server-side.
  const displayedOrders = useMemo(() => {
    if (sourceFilter !== "POS") return orders;
    return orders.filter((o) => {
      const src = (o?.orderSource || "POS").toUpperCase();
      return src === "POS";
    });
  }, [orders, sourceFilter]);

  const openOrderDetail = useCallback((order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  }, []);

  const showBranchOnCards =
    showOnlineBranchColumn ||
    (branches.length > 1 && ordersBranchFilter === "ALL");

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
        <ListPageHeader
          icon={ShoppingCart}
          title={t("pages.orders.list.title")}
          subtitle={t("pages.orders.list.subtitle")}
          actions={
            canCreate ? (
              <Button
                variant="success"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setCreateOrderOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("pages.orders.list.createOrder")}
                </span>
                <span className="sm:hidden">{t("pages.orders.list.createOrderShort")}</span>
              </Button>
            ) : null
          }
        />

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
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
            value={
              <span className="inline-flex items-baseline justify-center sm:justify-start gap-0.5 max-w-full min-w-0 w-full whitespace-nowrap">
                <span className="truncate">
                  {stats.revenue.toLocaleString(numberLocale)}
                </span>
                <span className="shrink-0">₫</span>
              </span>
            }
            valueTitle={`${stats.revenue.toLocaleString(numberLocale)} ₫`}
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
            <div className="flex rounded-lg border bg-muted/50 p-0.5">
              {[
                { value: "ALL", label: t("pages.orders.list.sourceTabAll") },
                {
                  value: "POS",
                  label: t("pages.orders.list.sourceTabPos"),
                  badge: posPendingCount,
                },
                {
                  value: "ONLINE",
                  label: t("pages.orders.list.sourceTabOnline"),
                  badge: onlinePendingCount,
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => applySourceFilter(tab.value)}
                  className={cn(
                    "relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5",
                    sourceFilter === tab.value
                      ? "bg-background shadow-sm text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.value === "ONLINE" ? (
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                  {tab.label}
                  {tab.badge > 0 ? (
                    <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold min-w-[1.125rem] h-[1.125rem] px-1 inline-flex items-center justify-center">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {branches.length > 1 && (
              <Select
                value={ordersBranchFilter}
                onValueChange={(v) => {
                  setOrdersBranchFilterPersisted(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  const params = new URLSearchParams();
                  if (sourceFilter === "ONLINE") params.set("source", "ONLINE");
                  else if (sourceFilter === "POS") params.set("source", "POS");
                  if (v && v !== "ALL") params.set("branchId", v);
                  const q = params.toString();
                  navigate(q ? `/orders?${q}` : "/orders", { replace: true });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue
                    placeholder={
                      sourceFilter === "ONLINE"
                        ? t("pages.orders.list.onlineBranchFilter")
                        : t("pages.orders.list.allBranches")
                    }
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
            <div className="flex rounded-lg border bg-muted/50 p-0.5">
              <button
                type="button"
                title={t("pages.orders.list.viewTable")}
                onClick={() => setListViewPersisted("table")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  listView === "table"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={t("pages.orders.list.viewCards")}
                onClick={() => setListViewPersisted("cards")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  listView === "cards"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {listView === "table" ? <DataTableViewOptions table={table} /> : null}
          </div>
        </div>

        {sourceFilter === "ONLINE" && branches.length > 1 && (
          <div className="rounded-lg border border-sky-200/80 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/25 px-4 py-3 text-sm text-sky-950 dark:text-sky-100 flex gap-2 items-start">
            <Globe className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {ordersBranchFilter === "ALL"
                ? t("pages.orders.list.onlineScopeBanner")
                : t("pages.orders.list.onlineScopeBannerBranch", {
                    branch:
                      branchNameById.get(ordersBranchFilter) ||
                      ordersBranchFilter,
                  })}
            </p>
          </div>
        )}

        {/* ── Order list (table | cards) ─────────────────────────── */}
        {listView === "table" ? (
        <div className="relative overflow-hidden rounded-md border">
          {loading && orders.length > 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}
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
                table.getRowModel().rows.map((row) => {
                  const order = row.original;
                  const rowEl = (
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => openOrderDetail(order)}
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
                  );

                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>{rowEl}</ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[12rem] bg-background w-48">
                        {renderOrderActions(order, {
                          Item: ContextMenuItem,
                          Label: ContextMenuLabel,
                          Separator: ContextMenuSeparator,
                          variant: "context",
                        })}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })
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
        ) : (
        <div className="relative">
          {loading && orders.length > 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/40 min-h-[12rem]">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          {loading && orders.length === 0 ? (
            <div className="grid auto-rows-fr items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <OrderListCardSkeleton key={idx} />
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
              <p>{t("pages.orders.list.empty")}</p>
            </div>
          ) : (
            <div className="grid auto-rows-fr items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayedOrders.map((order) => {
                const tableName = order.tableId
                  ? tableNameById.get(order.tableId) ||
                    t("pages.orders.list.tableFallback", {
                      id: shortId(order.tableId),
                    })
                  : null;
                const branchName = order.branchId
                  ? branchNameById.get(order.branchId) || shortId(order.branchId)
                  : null;
                const card = (
                  <OrderListCard
                    order={order}
                    numberLocale={numberLocale}
                    tableName={tableName}
                    branchName={branchName}
                    showBranch={showBranchOnCards}
                    showTable={shopHasTableManagement}
                    onOpen={() => openOrderDetail(order)}
                    actionsMenu={renderOrderActions(order, {
                      Item: DropdownMenuItem,
                      Label: DropdownMenuLabel,
                      Separator: DropdownMenuSeparator,
                      variant: "dropdown",
                    })}
                  />
                );
                return (
                  <div key={order.id} className="h-full min-h-0">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
                    <ContextMenuContent className="min-w-[12rem] bg-background w-48">
                      {renderOrderActions(order, {
                        Item: ContextMenuItem,
                        Label: ContextMenuLabel,
                        Separator: ContextMenuSeparator,
                        variant: "context",
                      })}
                    </ContextMenuContent>
                  </ContextMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

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
                  accept={PRODUCT_IMAGE_ACCEPT}
                  onChange={handlePaymentProofDialogFile}
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
