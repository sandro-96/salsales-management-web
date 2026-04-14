import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  Receipt,
  Search,
  Filter,
  Plus,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import {
  getOrders,
  filterOrders,
  cancelOrder,
  confirmPayment,
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
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import CreateOrderModal from "./CreateOrderModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = {
  PENDING: {
    label: "Chờ xử lý",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 border-amber-200",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    cls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  SHIPPING: {
    label: "Đang giao",
    icon: Truck,
    cls: "bg-violet-100 text-violet-800 border-violet-200",
  },
  COMPLETED: {
    label: "Hoàn tất",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: Ban,
    cls: "bg-red-100 text-red-800 border-red-200",
  },
};

const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "Card", label: "Thẻ" },
  { value: "Transfer", label: "Chuyển khoản" },
];

/** Mã đơn hàng hiển thị (API: orderCode); đơn cũ có thể chỉ có id. */
function displayOrderCode(order) {
  const code = order?.orderCode?.trim();
  if (code) return code;
  const id = order?.id;
  if (!id) return "—";
  return id.length > 10 ? `DH-${id.slice(-8).toUpperCase()}` : String(id).toUpperCase();
}

/** Biến thể: ưu tiên tên từ API; nếu chỉ có variantId vẫn hiển thị mã rút gọn. */
function orderLineVariantLabel(item) {
  const name = item?.variantName;
  if (name && String(name).trim()) {
    const t = String(name).trim();
    if (t.startsWith("Biến thể")) return t;
    return `Biến thể: ${t}`;
  }
  const vid = item?.variantId;
  if (!vid || !String(vid).trim()) return null;
  const id = String(vid).trim();
  const short = id.length > 10 ? id.slice(-8).toUpperCase() : id;
  return `Biến thể (mã): ${short}`;
}

/** Có dòng thuế / tổng thuế > 0 trên snapshot đơn. */
function orderHasPositiveTax(tax) {
  if (!tax) return false;
  const total = tax.taxTotal ?? 0;
  if (total > 0.005) return true;
  return (tax.taxes || []).some((l) => (l.amount ?? 0) > 0.005);
}

function orderTaxSummaryTooltip(order) {
  const t = order.taxSnapshot;
  if (!t) {
    return "Đơn không có snapshot thuế (đơn rất cũ hoặc dữ liệu thiếu). Chỉ xem được tổng tiền hàng.";
  }
  const lines = [
    t.priceIncludesTax
      ? "Chính sách: giá bán đã gồm thuế — «Tạm tính» là NET (đã tách VAT)."
      : "Chính sách: giá chưa gồm thuế — thuế cộng thêm vào tạm tính.",
    `Tạm tính (cơ sở thuế): ${(t.netAmount ?? 0).toLocaleString("vi-VN")} ₫`,
  ];
  if (orderHasPositiveTax(t)) {
    lines.push(`Tổng thuế: ${(t.taxTotal ?? 0).toLocaleString("vi-VN")} ₫`);
    (t.taxes || []).forEach((x) => {
      if ((x.amount ?? 0) > 0.005) {
        lines.push(
          `${x.label}: ${(x.amount ?? 0).toLocaleString("vi-VN")} ₫`,
        );
      }
    });
  } else {
    lines.push("Không phát sinh tiền thuế (0 ₫) trên đơn này.");
  }
  lines.push(
    `Tổng thanh toán: ${(t.grandTotal ?? order.totalPrice ?? 0).toLocaleString("vi-VN")} ₫`,
  );
  return lines.join("\n");
}

function OrderTaxBadge({ order }) {
  const t = order.taxSnapshot;
  if (!t) {
    return (
      <span
        className="text-[11px] text-muted-foreground tabular-nums"
        title="Không có snapshot thuế"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        —
      </span>
    );
  }
  const has = orderHasPositiveTax(t);
  return (
    <Badge
      variant={has ? "default" : "secondary"}
      className={
        has
          ? "text-[10px] gap-0.5 font-normal bg-sky-600 text-white hover:bg-sky-600/90 border-0 cursor-help"
          : "text-[10px] font-normal cursor-help"
      }
      title={orderTaxSummaryTooltip(order)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Percent className="h-3 w-3 opacity-90" />
      {has ? "Có thuế" : "0 thuế"}
    </Badge>
  );
}

function PaymentCollectionBadge({ paid, paymentStatus }) {
  if (paid) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1">
        <CreditCard className="h-3 w-3" /> Đã thanh toán
      </Badge>
    );
  }
  if (paymentStatus === "PENDING_COLLECTION") {
    return (
      <Badge className="gap-1 text-[11px] bg-amber-100 text-amber-900 border-amber-200">
        <Truck className="h-3 w-3" /> Chờ thu COD
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] gap-1">
      Chưa thanh toán
    </Badge>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const OrderStatusBadge = ({ status }) => {
  const cfg = ORDER_STATUSES[status] || { label: status, icon: Clock, cls: "" };
  const IconComp = cfg.icon;
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {cfg.label}
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
  onSaved,
  onOrderPatched,
}) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    note: "",
    customerId: "",
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
        shippingCarrier: form.shippingCarrier.trim(),
        shippingMethod: form.shippingMethod.trim(),
        trackingNumber: form.trackingNumber.trim(),
        externalOrderRef: form.externalOrderRef.trim(),
      };
      const res = await patchOrderFulfillment(order.id, shopId, payload);
      const updated = res.data?.data;
      toast.success("Đã cập nhật thông tin đơn hàng.");
      if (updated && onOrderPatched) onOrderPatched(updated);
      onSaved?.();
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Không thể cập nhật thông tin đơn hàng.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;
  const customerIdUnchanged =
    (form.customerId || "").trim() === (order.customerId || "").trim();
  const showCustomerSummary =
    !!(
      order.customerName ||
      order.customerPhone ||
      order.customerId
    ) &&
    (!canEdit || customerIdUnchanged);
  const tax = order.taxSnapshot;
  const itemsSubtotal = (order.items ?? []).reduce(
    (s, i) =>
      s +
      (i.priceAfterDiscount ?? i.price ?? 0) * (i.quantity ?? 0),
    0,
  );
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Chi tiết đơn hàng
          </DialogTitle>
          <DialogDescription>
            Mã đơn hàng:{" "}
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

          {showCustomerSummary && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Khách hàng: </span>
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

          {!canEdit &&
            (order.note ||
              order.shippingCarrier ||
              order.shippingMethod ||
              order.trackingNumber ||
              order.externalOrderRef) && (
            <div className="rounded-md border p-3 space-y-1 text-sm">
              {order.note && (
                <p>
                  <span className="text-muted-foreground">Ghi chú: </span>
                  {order.note}
                </p>
              )}
              {order.externalOrderRef && (
                <p>
                  <span className="text-muted-foreground">Tham chiếu ngoài: </span>
                  <span className="font-mono">{order.externalOrderRef}</span>
                </p>
              )}
              {order.shippingMethod && (
                <p>
                  <span className="text-muted-foreground">Hình thức giao: </span>
                  {order.shippingMethod}
                </p>
              )}
              {order.shippingCarrier && (
                <p>
                  <span className="text-muted-foreground">Đơn vị VC: </span>
                  {order.shippingCarrier}
                </p>
              )}
              {order.trackingNumber && (
                <p>
                  <span className="text-muted-foreground">Vận đơn: </span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          )}

          {canEdit && (
            <div className="rounded-md border p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Giao hàng & tham chiếu (lưu được cả đơn đã thanh toán)
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Ghi chú</Label>
                <Textarea
                  className="text-sm min-h-[56px]"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Khách hàng (ID hệ thống)</Label>
                <Input
                  className="h-8 text-sm font-mono"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerId: e.target.value }))
                  }
                  placeholder="Dán ID khách hàng; để trống nếu không gắn"
                />
                <p className="text-[11px] text-muted-foreground">
                  Tên và SĐT hiển thị ở trên theo ID đã lưu; đổi ID rồi bấm Lưu để cập nhật.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tham chiếu ngoài (Shopee, …)</Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.externalOrderRef}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, externalOrderRef: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hình thức giao / kênh</Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.shippingMethod}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shippingMethod: e.target.value }))
                    }
                    placeholder="VD: Shopee, Ship COD ngoài"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Đơn vị vận chuyển</Label>
                  <Input
                    className="h-8 text-sm"
                    value={form.shippingCarrier}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shippingCarrier: e.target.value }))
                    }
                    placeholder="GHN, GHTK, …"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mã vận đơn</Label>
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
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item, idx) => {
                  const basePrice = item.price ?? 0;
                  const unitAfter =
                    item.priceAfterDiscount ?? item.price ?? 0;
                  const showOrig =
                    Math.abs(basePrice - unitAfter) > 0.009;
                  const lineTotal = unitAfter * item.quantity;
                  const promoBits = [
                    item.promotionName,
                    item.promotionDiscountLabel,
                  ].filter(Boolean);
                  const variantLabel = orderLineVariantLabel(item);
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
                        {item.sku && (
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            SKU: {item.sku}
                          </p>
                        )}
                        {promoBits.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              KM: {promoBits.join(" · ")}
                            </Badge>
                          </div>
                        )}
                        {!item.promotionName &&
                          !item.promotionDiscountLabel &&
                          item.appliedPromotionId &&
                          promoBits.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              CTKM (không tìm thấy tên):{" "}
                              <span className="font-mono">
                                {item.appliedPromotionId.length > 10
                                  ? item.appliedPromotionId.slice(-8)
                                  : item.appliedPromotionId}
                              </span>
                            </p>
                          )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums align-top">
                        {showOrig && (
                          <span className="line-through text-muted-foreground text-xs block">
                            {basePrice.toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                        <span>{unitAfter.toLocaleString("vi-VN")} ₫</span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums align-top">
                        {lineTotal.toLocaleString("vi-VN")} ₫
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
                <span className="text-muted-foreground">Tổng tiền hàng</span>
                <span className="tabular-nums">
                  {itemsSubtotal.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>
                  Giảm đổi điểm
                  {order.pointsRedeemed
                    ? ` (${order.pointsRedeemed} điểm)`
                    : ""}
                </span>
                <span className="tabular-nums">
                  −{order.pointsDiscount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/30 px-3 py-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">
                Thanh toán & thuế
              </span>
              {tax && (
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0 font-normal border-sky-300/80 dark:border-sky-700"
                >
                  Snapshot lúc tạo đơn
                </Badge>
              )}
            </div>

            {tax ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tax.priceIncludesTax
                    ? "Giá bán đang cấu hình đã gồm thuế: «Tạm tính» là phần chưa thuế (NET) — VAT đã được tách ra khỏi giá để hiển thị đúng dòng thuế."
                    : "Giá chưa gồm thuế: «Tạm tính» là tổng hàng; các dòng thuế cộng thêm; «Tổng thanh toán» là số khách phải trả."}
                </p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {tax.priceIncludesTax
                      ? "Tạm tính (NET — đã trừ VAT khỏi giá bán)"
                      : "Tạm tính (chưa gồm thuế)"}
                  </span>
                  <span className="tabular-nums font-medium">
                    {(tax.netAmount ?? 0).toLocaleString("vi-VN")} ₫
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
                      {(taxLine.amount ?? 0).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                ))}
                {!orderHasPositiveTax(tax) && (
                  <p className="text-xs text-muted-foreground italic">
                    Không phát sinh tiền thuế trên đơn (tổng thuế = 0 ₫).
                  </p>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng thuế</span>
                  <span className="tabular-nums">
                    {(tax.taxTotal ?? 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-sky-200/90 dark:border-sky-800/60">
                  <span>Tổng thanh toán</span>
                  <span className="tabular-nums text-sky-900 dark:text-sky-100">
                    {(tax.grandTotal ?? order.totalPrice ?? 0).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    ₫
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Không có snapshot thuế trên đơn — thường gặp ở đơn tạo trước khi
                  hệ thống lưu thuế. Xem tổng tiền hàng; cấu hình thuế tại mục
                  chính sách thuế theo chi nhánh.
                </p>
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Tổng cộng</span>
                  <span className="tabular-nums">
                    {(order.totalPrice ?? 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </>
            )}
          </div>

          {order.paymentMethod && (
            <div className="text-sm text-muted-foreground">
              Thanh toán: {order.paymentMethod}
              {order.paymentTime &&
                ` — ${new Date(order.paymentTime).toLocaleString("vi-VN")}`}
            </div>
          )}
        </div>

        {canEdit && order.status !== "CANCELLED" && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleSaveFulfillment}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Lưu thông tin đơn
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const OrderListPage = () => {
  const [searchParams] = useSearchParams();
  const {
    selectedShopId,
    selectedBranchId,
    branches,
    setSelectedBranchId,
    isOwner,
    isStaff,
  } = useShop();
  const { confirm } = useAlertDialog();
  const canManage = isOwner || isStaff;

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payingOrderSnapshot, setPayingOrderSnapshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

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

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!selectedShopId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sort: "createdAt,desc",
      };
      const effectiveBranchId =
        selectedBranchId ??
        (branches.length === 1 ? branches[0]?.id : null);
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
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, selectedBranchId, branches, pagination, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      const ok = await confirm(
        `Bạn có chắc muốn hủy đơn hàng này? Tồn kho sẽ được hoàn lại.`,
        {
          title: "Hủy đơn hàng",
          confirmText: "Hủy đơn",
          cancelText: "Đóng",
          variant: "destructive",
        },
      );
      if (!ok) return;
      try {
        setSubmitting(true);
        await cancelOrder(order.id, selectedShopId);
        toast.success("Đã hủy đơn hàng.");
        fetchOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể hủy đơn hàng.");
      } finally {
        setSubmitting(false);
      }
    },
    [confirm, selectedShopId, fetchOrders],
  );

  const handleStatusChange = useCallback(
    async (order, newStatus) => {
      try {
        setSubmitting(true);
        await updateOrderStatus(order.id, selectedShopId, newStatus);
        toast.success(
          `Đã cập nhật trạng thái: ${ORDER_STATUSES[newStatus]?.label || newStatus}`,
        );
        fetchOrders();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Không thể cập nhật trạng thái.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedShopId, fetchOrders],
  );

  const openPaymentDialog = useCallback((order) => {
    setPayingOrderSnapshot(order);
    setPayingOrderId(order.id);
    setPaymentMethod("Cash");
    setPaymentDialogOpen(true);
  }, []);

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
      toast.success("Thanh toán thành công.");
      setPaymentDialogOpen(false);
      setPayingOrderSnapshot(null);
      setPayingOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể xác nhận thanh toán.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        accessorKey: "orderCode",
        header: "Mã đơn hàng",
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {displayOrderCode(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Thời gian" />
        ),
        cell: ({ row }) => {
          const d = row.original.createdAt;
          if (!d) return "—";
          const date = new Date(d);
          return (
            <div>
              <p className="text-sm">{date.toLocaleDateString("vi-VN")}</p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleTimeString("vi-VN")}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "items",
        header: "Sản phẩm",
        enableSorting: false,
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          if (items.length === 0)
            return <span className="text-muted-foreground">—</span>;
          const variant0 = orderLineVariantLabel(items[0]);
          return (
            <div className="max-w-[200px]">
              <p className="text-sm font-medium truncate">
                {items[0].productName}
              </p>
              {variant0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {variant0}
                </p>
              )}
              {items.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{items.length - 1} sản phẩm khác
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "SL",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.totalAmount ?? 0}
          </span>
        ),
      },
      {
        id: "taxSnapshot",
        header: "Thuế",
        enableSorting: false,
        cell: ({ row }) => <OrderTaxBadge order={row.original} />,
      },
      {
        accessorKey: "totalPrice",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng tiền" />
        ),
        cell: ({ row }) => {
          const total =
            row.original.taxSnapshot?.grandTotal ??
            row.original.totalPrice ??
            0;
          return (
            <span className="text-sm font-semibold tabular-nums">
              {total.toLocaleString("vi-VN")} ₫
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "paid",
        header: "Thanh toán",
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
                  <span className="sr-only">Mở menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setDetailOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                </DropdownMenuItem>

                {!order.paid && !isTerminal && canManage && (
                  <DropdownMenuItem onClick={() => openPaymentDialog(order)}>
                    <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    Thanh toán
                  </DropdownMenuItem>
                )}

                {order.status === "PENDING" && canManage && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "CONFIRMED")}
                    disabled={submitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /> Xác
                    nhận
                  </DropdownMenuItem>
                )}

                {order.status === "CONFIRMED" && canManage && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "SHIPPING")}
                    disabled={submitting}
                  >
                    <Truck className="h-4 w-4 mr-2 text-violet-600" /> Giao hàng
                  </DropdownMenuItem>
                )}

                {(order.status === "SHIPPING" ||
                  order.status === "CONFIRMED") &&
                  canManage && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(order, "COMPLETED")}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                      Hoàn tất
                    </DropdownMenuItem>
                  )}

                {!order.paid && !isTerminal && canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700"
                      onClick={() => handleCancel(order)}
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Hủy đơn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canManage, submitting, handleCancel, handleStatusChange, openPaymentDialog],
  );

  const table = useReactTable({
    data: orders,
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
              Quản lý đơn hàng
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và xử lý đơn hàng
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo đơn hàng
            </Button>
          )}
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={ShoppingCart}
            label="Tổng đơn hàng"
            value={stats.total}
            iconClassName="bg-violet-100 text-violet-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={Clock}
            label="Chờ xử lý"
            value={stats.pending}
            iconClassName="bg-amber-100 text-amber-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CheckCircle2}
            label="Hoàn tất"
            value={stats.completed}
            iconClassName="bg-emerald-100 text-emerald-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CreditCard}
            label="Doanh thu"
            value={stats.revenue.toLocaleString("vi-VN") + " ₫"}
            iconClassName="bg-sky-100 text-sky-600"
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
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(ORDER_STATUSES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
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
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ALL">Tất cả chi nhánh</SelectItem>
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
                    Đang tải...
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
                      <p>Chưa có đơn hàng nào.</p>
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
        canEdit={canManage}
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
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" /> Xác nhận thanh
              toán
            </DialogTitle>
            <DialogDescription>
              {payingOrderSnapshot?.paymentStatus === "PENDING_COLLECTION"
                ? "Đơn Ship COD — chọn phương thức tiền đã thu thực tế (thường là Tiền mặt), rồi xác nhận để đánh dấu đã thanh toán."
                : "Chọn phương thức thanh toán cho đơn hàng."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button onClick={handleConfirmPayment} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                Xác nhận
              </Button>
            </div>
          </div>
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
