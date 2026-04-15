import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Loader2,
  UtensilsCrossed,
  X,
  Receipt,
  Tag,
  Percent,
  UserRound,
  Star,
  Coins,
  Printer,
  Eye,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop";
import { getBranchProducts } from "../../api/productApi";
import { getCurrentOrderByTable, getTables } from "../../api/tableApi";
import { getPromotions } from "../../api/promotionApi";
import {
  createTableGroup,
  deleteTableGroup,
  getTableGroups,
} from "../../api/tableGroupApi";
import {
  createOrder,
  confirmPayment,
  previewOrderTax,
  patchOrderFulfillment,
  updateOrder,
  updateOrderStatus,
  moveOrderTable,
  splitOrder,
} from "../../api/orderApi";
import { PosInvoiceReceipt } from "../../components/pos/PosInvoiceReceipt";
import { printPosInvoiceReceipt } from "../../components/pos/printPosInvoiceReceipt";
import {
  createCustomer,
  getCustomers,
  getCustomerPoints,
} from "../../api/customerApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt", icon: Banknote },
  { value: "Card", label: "Thẻ", icon: CreditCard },
  { value: "Transfer", label: "Chuyển khoản", icon: ArrowRightLeft },
  { value: "ShipCOD", label: "Ship COD", icon: Truck },
];

function getPaymentMethodLabel(value) {
  if (!value) return null;
  if (value === "Ship COD") return "Ship COD";
  return PAYMENT_METHODS.find((p) => p.value === value)?.label || value;
}

function buildDraftOrderForInvoice({
  cart,
  subtotal,
  taxPreview,
  pointsToRedeem,
  note,
  paymentMethod,
}) {
  const pointsDiscount = pointsToRedeem * 1000;
  const baseAfterPoints = Math.max(0, subtotal - pointsDiscount);
  const items = cart.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.hasDiscount ? item.originalPrice : item.price,
    priceAfterDiscount: item.price,
  }));
  return {
    items,
    totalPrice: baseAfterPoints,
    totalAmount: taxPreview?.grandTotal ?? baseAfterPoints,
    taxSnapshot: taxPreview,
    note: note || null,
    paid: false,
    paymentMethod,
    paymentTime: null,
    pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : 0,
    pointsDiscount: pointsToRedeem > 0 ? pointsDiscount : 0,
  };
}

const ALL_CATEGORY = "__ALL__";

function PosTaxBreakdown({ loading, taxPreview }) {
  if (!loading && !taxPreview) return null;
  if (loading) {
    return (
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Thuế</span>
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          Đang tính…
        </span>
      </div>
    );
  }
  const lines = taxPreview.taxes || [];
  return (
    <div className="space-y-1.5">
      {taxPreview.priceIncludesTax && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Giá món đang áp dạng đã bao gồm thuế (theo chính sách cửa hàng).
        </p>
      )}
      {lines.map((line, idx) => (
        <div
          key={`${line.code}-${line.label}-${idx}`}
          className="flex justify-between items-center text-xs"
        >
          <span className="text-muted-foreground">
            {line.label || line.code || "Thuế"}
            {line.rate > 0 && line.rate <= 1 ? (
              <span className="opacity-80">
                {" "}
                ({(line.rate * 100).toLocaleString("vi-VN")}%)
              </span>
            ) : null}
          </span>
          <span className="tabular-nums font-medium">
            {line.amount.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      ))}
      {lines.length === 0 && taxPreview.taxTotal === 0 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Thuế</span>
          <span className="tabular-nums">0 ₫</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-1 border-t border-border/70">
        <span className="text-sm font-semibold">Tổng thanh toán</span>
        <span className="text-base font-bold text-primary tabular-nums">
          {taxPreview.grandTotal.toLocaleString("vi-VN")} ₫
        </span>
      </div>
    </div>
  );
}

function buildPromotionMap(promotions, branchId) {
  const now = new Date();
  const active = promotions.filter((p) => {
    if (!p.active) return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    if (p.branchId && p.branchId !== branchId) return false;
    return true;
  });

  const map = new Map();
  for (const promo of active) {
    const ids = promo.applicableProductIds;
    if (!ids || ids.length === 0) {
      map.set("__SHOP_WIDE__", [...(map.get("__SHOP_WIDE__") || []), promo]);
    } else {
      for (const pid of ids) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(promo);
      }
    }
  }
  return { promoMap: map, activePromotions: active };
}

function getBestPromo(promoMap, productId) {
  const specific = promoMap.get(productId) || [];
  const shopWide = promoMap.get("__SHOP_WIDE__") || [];
  const all = [...specific, ...shopWide];
  if (all.length === 0) return null;
  return all[0];
}

function calcDiscountedPrice(basePrice, promo) {
  if (!promo) return basePrice;
  if (promo.discountType === "PERCENT") {
    return basePrice * (1 - promo.discountValue / 100);
  }
  return Math.max(0, basePrice - promo.discountValue);
}

function formatDiscount(promo) {
  if (!promo) return "";
  if (promo.discountType === "PERCENT") return `-${promo.discountValue}%`;
  return `-${promo.discountValue.toLocaleString("vi-VN")}₫`;
}

function hasBranchVariants(product) {
  return (
    Array.isArray(product?.branchVariants) && product.branchVariants.length > 0
  );
}

function variantCatalogName(product, variantId) {
  const v = (product?.variants || []).find((x) => x.variantId === variantId);
  return v?.name || variantId || "";
}

function cartFromOrderItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((it, idx) => {
    const unit = it?.priceAfterDiscount ?? it?.price ?? 0;
    const base = it?.price ?? unit;
    const hasDiscount = base != null && unit < base;
    const label = it?.variantName ? ` — ${it.variantName}` : "";
    const name = `${it?.productName || "Sản phẩm"}${label}`;
    const productId = it?.productId || "";
    const variantId = it?.variantId || null;
    return {
      lineKey: variantId ? `${productId}__${variantId}` : `${productId}__${idx}`,
      productId,
      variantId,
      productName: name,
      originalPrice: base,
      price: unit,
      hasDiscount,
      promoLabel: it?.promotionDiscountLabel || null,
      quantity: it?.quantity ?? 0,
      trackInventory: null,
      maxStock: null,
    };
  });
}

function createEmptyTab(id) {
  return {
    id,
    orderId: null,
    cart: [],
    tableId: "",
    note: "",
    customer: null,
    pointsToRedeem: 0,
  };
}

const OrderTabBar = ({
  tabs,
  activeTabId,
  onSelect,
  onAdd,
  onClose,
  tables,
}) => (
  <div className="border-b flex items-center gap-0.5 px-1.5 pt-1.5 overflow-x-auto bg-muted/30">
    {tabs.map((tab) => {
      const isActive = tab.id === activeTabId;
      const itemCount = tab.cart.reduce((s, i) => s + i.quantity, 0);
      const tableName =
        tab.tableId && tab.tableId !== "none"
          ? tables.find((t) => t.id === tab.tableId)?.name
          : null;
      const label = tableName || `Đơn ${tab.id}`;
      return (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors shrink-0 ${
            isActive
              ? "bg-card border border-b-card text-foreground -mb-px z-10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <span className="truncate max-w-[80px]">{label}</span>
          {itemCount > 0 && (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="h-4 min-w-4 px-1 text-[10px] justify-center"
            >
              {itemCount}
            </Badge>
          )}
          {tabs.length > 1 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Đóng đơn"
              className="ml-0.5 shrink-0 inline-flex items-center justify-center rounded p-1 -m-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity active:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose(tab.id);
                }
              }}
            >
              <X className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-muted-foreground hover:text-destructive" />
            </span>
          )}
        </button>
      );
    })}
    <button
      onClick={onAdd}
      className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-0.5"
      title="Thêm đơn mới"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

const CartPanel = ({
  cart,
  totalItems,
  subtotal,
  totalSavings,
  note,
  setNote,
  selectedTableId,
  setSelectedTableId,
  availableTables,
  updateQuantity,
  removeFromCart,
  clearCart,
  onCheckout,
  hideHeader,
  selectedCustomer,
  onCustomerSearch,
  onSelectCustomer,
  onClearCustomer,
  customerResults,
  customerSearching,
  pointsToRedeem,
  taxPreview,
  taxPreviewLoading,
  showTableSelect,
  onHoldOrder,
  onSendKitchen,
  holdDisabled,
  sendKitchenDisabled,
  onOpenGroupDialog,
  onOpenSplitDialog,
  splitDisabled,
  activeGroup,
  tables,
  onQuickSwitchTable,
}) => (
  <>
    {!hideHeader && (
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-semibold text-sm">Đơn hàng</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalItems}
            </Badge>
          )}
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-destructive"
            onClick={clearCart}
          >
            Xóa tất cả
          </Button>
        )}
      </div>
    )}

    <div className="p-3 border-b space-y-2">
      {/* Customer selection */}
      {selectedCustomer ? (
        <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2.5 py-2">
          <UserRound className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {selectedCustomer.name}
            </p>
            <div className="flex items-center gap-1.5">
              {selectedCustomer.phone && (
                <span className="text-[10px] text-muted-foreground">
                  {selectedCustomer.phone}
                </span>
              )}
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 font-medium">
                <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                {(selectedCustomer.loyaltyPoints ?? 0).toLocaleString(
                  "vi-VN",
                )}{" "}
                điểm
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onClearCustomer}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm khách hàng (tên, SĐT)..."
            className="h-8 text-xs pl-7"
            onChange={(e) => onCustomerSearch(e.target.value)}
          />
          {customerSearching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {customerResults.length > 0 && (
            <div className="absolute z-20 mt-1 left-0 right-0 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2"
                  onClick={() => onSelectCustomer(c)}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    {c.phone && (
                      <p className="text-muted-foreground text-[10px]">
                        {c.phone}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 shrink-0">
                    <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                    {(c.loyaltyPoints ?? 0).toLocaleString("vi-VN")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showTableSelect && (
        <div className="space-y-2">
          <Select
            value={selectedTableId || "none"}
            onValueChange={setSelectedTableId}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Chọn bàn (tuỳ chọn)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">
                Không chọn bàn
              </SelectItem>
              {availableTables.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {t.name} {t.capacity ? `(${t.capacity} chỗ)` : ""}
                    </span>
                    {activeGroup?.tableIds?.includes?.(t.id) ? (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {activeGroup.name ? activeGroup.name : "Nhóm"}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeGroup?.tableIds?.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {activeGroup.tableIds
                .filter((id) => id && id !== selectedTableId)
                .map((id) => (
                  <Button
                    key={id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => onQuickSwitchTable(id)}
                  >
                    {tables.find((t) => t.id === id)?.name || id}
                  </Button>
                ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={onOpenGroupDialog}
            >
              Ghép bàn
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs"
              onClick={onOpenSplitDialog}
              disabled={splitDisabled}
            >
              Tách món
            </Button>
          </div>
        </div>
      )}
    </div>

    <ScrollArea className="flex-1">
      {cart.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Chưa có sản phẩm nào</p>
            <p className="text-[10px] mt-1">
              Nhấn vào sản phẩm để thêm vào đơn
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y">
          {cart.map((item) => (
            <div key={item.lineKey} className="p-3 flex gap-2">
              <div className="h-10 w-10 rounded bg-muted shrink-0 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate">
                  {item.productName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.hasDiscount ? (
                    <>
                      <span className="text-[11px] line-through text-muted-foreground">
                        {item.originalPrice.toLocaleString("vi-VN")}₫
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {item.price.toLocaleString("vi-VN")}₫
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {item.price.toLocaleString("vi-VN")} ₫
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.lineKey, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-semibold w-6 text-center tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.lineKey, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.lineKey)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <span className="text-xs font-bold tabular-nums">
                  {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>

    <div className="p-3 border-t">
      <Textarea
        placeholder="Ghi chú đơn hàng..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-xs min-h-[56px] resize-none"
        rows={2}
      />
    </div>

    <div className="p-3 border-t space-y-2">
      {totalSavings > 0 && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-600 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Tiết kiệm
          </span>
          <span className="text-emerald-600 font-semibold tabular-nums">
            -{totalSavings.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Tạm tính</span>
        <span
          className={`tabular-nums font-semibold ${
            taxPreview || taxPreviewLoading ? "text-sm" : "text-lg font-bold"
          }`}
        >
          {subtotal.toLocaleString("vi-VN")} ₫
        </span>
      </div>
      {pointsToRedeem > 0 && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Giảm điểm</span>
          <span className="text-emerald-600 font-medium tabular-nums">
            -{(pointsToRedeem * 1000).toLocaleString("vi-VN")} ₫
          </span>
        </div>
      )}
      {cart.length > 0 && (
        <PosTaxBreakdown loading={taxPreviewLoading} taxPreview={taxPreview} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="h-10 text-xs font-semibold"
          disabled={holdDisabled}
          onClick={onHoldOrder}
        >
          <Receipt className="h-4 w-4 mr-2" />
          Treo / Lưu
        </Button>
        <Button
          variant="outline"
          className="h-10 text-xs font-semibold"
          disabled={sendKitchenDisabled}
          onClick={onSendKitchen}
        >
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Gửi bếp
        </Button>
      </div>
      <Button
        className="w-full h-11 text-sm font-semibold"
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Thanh toán ({totalItems} món)
      </Button>
    </div>
  </>
);

const PosPage = () => {
  const {
    selectedShopId,
    selectedBranchId,
    branches,
    setSelectedBranchId,
    selectedShop,
  } = useShop();

  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const [orderTabs, setOrderTabs] = useState([createEmptyTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const nextTabIdRef = React.useRef(2);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [previewPrintedAt, setPreviewPrintedAt] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);

  const [postSaleOpen, setPostSaleOpen] = useState(false);
  const [postSaleOrderId, setPostSaleOrderId] = useState(null);
  const [postSaleName, setPostSaleName] = useState("");
  const [postSalePhone, setPostSalePhone] = useState("");
  const [postSaleSaving, setPostSaleSaving] = useState(false);

  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const [tableGroups, setTableGroups] = useState([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupSelectedIds, setGroupSelectedIds] = useState([]);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitToTableId, setSplitToTableId] = useState("none");
  const [splitQtyByLineKey, setSplitQtyByLineKey] = useState({});

  const tableGroupByTableId = useMemo(() => {
    const map = new Map();
    (tableGroups || []).forEach((g) => {
      (g.tableIds || []).forEach((tid) => {
        if (tid) map.set(tid, g);
      });
    });
    return map;
  }, [tableGroups]);

  const activeTab = orderTabs.find((t) => t.id === activeTabId) || orderTabs[0];
  const cart = useMemo(() => activeTab?.cart || [], [activeTab]);
  const cartRef = React.useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  const selectedTableId = activeTab?.tableId || "";
  const note = activeTab?.note || "";
  const selectedCustomer = activeTab?.customer || null;
  const pointsToRedeem = activeTab?.pointsToRedeem || 0;
  const activeOrderId = activeTab?.orderId || null;

  const activeGroup = useMemo(() => {
    if (!selectedTableId || selectedTableId === "none") return null;
    return tableGroupByTableId.get(selectedTableId) || null;
  }, [selectedTableId, tableGroupByTableId]);

  const updateActiveTab = useCallback(
    (updates) => {
      setOrderTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, ...updates } : tab,
        ),
      );
    },
    [activeTabId],
  );

  const setCart = useCallback(
    (updater) => {
      setOrderTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;
          const newCart =
            typeof updater === "function" ? updater(tab.cart) : updater;
          return { ...tab, cart: newCart };
        }),
      );
    },
    [activeTabId],
  );

  const setSelectedTableId = useCallback(
    async (v) => {
      // When order already exists on server, change table via API to keep currentOrderId consistent.
      if (activeOrderId && v && v !== "none" && v !== selectedTableId) {
        try {
          await moveOrderTable(activeOrderId, selectedShopId, v);
          updateActiveTab({ tableId: v });
          toast.success("Đã đổi bàn.");
          return;
        } catch (err) {
          toast.error(err.response?.data?.message || "Không thể đổi bàn.");
          return;
        }
      }
      updateActiveTab({ tableId: v });
    },
    [activeOrderId, selectedShopId, selectedTableId, updateActiveTab],
  );
  const setNote = useCallback(
    (v) => updateActiveTab({ note: v }),
    [updateActiveTab],
  );
  const setSelectedCustomer = useCallback(
    (v) => updateActiveTab({ customer: v }),
    [updateActiveTab],
  );
  const setPointsToRedeem = useCallback(
    (v) => updateActiveTab({ pointsToRedeem: v }),
    [updateActiveTab],
  );

  const addTab = useCallback(() => {
    const id = nextTabIdRef.current++;
    setOrderTabs((prev) => [...prev, createEmptyTab(id)]);
    setActiveTabId(id);
    setCustomerResults([]);
  }, []);

  const switchTab = useCallback(
    (tabId) => {
      if (tabId !== activeTabId) {
        setActiveTabId(tabId);
        setCustomerResults([]);
      }
    },
    [activeTabId],
  );

  const closeTab = useCallback(
    (tabId) => {
      setOrderTabs((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((t) => t.id !== tabId);
        // Chỉ còn 1 đơn: reset bộ đếm id để đơn mới không bị nhảy số (vd. xóa đơn 2 → thêm lại là đơn 2).
        if (filtered.length === 1) {
          nextTabIdRef.current = filtered[0].id + 1;
        }
        if (tabId === activeTabId) {
          const idx = prev.findIndex((t) => t.id === tabId);
          const next = filtered[Math.min(idx, filtered.length - 1)];
          setActiveTabId(next.id);
        }
        return filtered;
      });
    },
    [activeTabId],
  );

  const effectiveBranchId =
    selectedBranchId || (branches.length === 1 ? branches[0]?.id : null);

  // Resume open order by table (multi-device)
  useEffect(() => {
    if (!selectedShopId) return;
    if (!selectedTableId || selectedTableId === "none") return;
    if (!effectiveBranchId) return;

    let alive = true;
    (async () => {
      try {
        const res = await getCurrentOrderByTable(selectedShopId, selectedTableId);
        const order = res.data?.data;
        if (!alive) return;
        if (!order?.id) return;
        // If already loaded, skip
        if (activeOrderId && activeOrderId === order.id) return;

        updateActiveTab({
          orderId: order.id,
          cart: cartFromOrderItems(order.items),
          note: order.note || "",
          customer: order.customerId
            ? { id: order.customerId, name: order.customerName, phone: order.customerPhone }
            : null,
          pointsToRedeem: order.pointsRedeemed ?? 0,
        });
        toast.info("Đã tải đơn đang mở của bàn.");
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    selectedShopId,
    selectedTableId,
    effectiveBranchId,
    activeOrderId,
    updateActiveTab,
  ]);

  const fetchData = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    setLoading(true);
    try {
      const [prodRes, tableRes, promoRes] = await Promise.all([
        getBranchProducts(selectedShopId, effectiveBranchId, {
          size: 500,
          active: true,
        }),
        getTables(selectedShopId, effectiveBranchId),
        getPromotions(selectedShopId, {
          branchId: effectiveBranchId,
          size: 200,
        }),
      ]);
      const prodList = prodRes.data?.data?.content || prodRes.data?.data || [];
      setProducts(prodList.filter((p) => p.activeInBranch !== false));
      const tableList =
        tableRes.data?.data?.content || tableRes.data?.data || [];
      setTables(tableList);
      const promoList =
        promoRes.data?.data?.content || promoRes.data?.data || [];
      setPromotions(promoList);
    } catch (err) {
      console.error("Failed to load POS data", err);
      toast.error("Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, effectiveBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchGroups = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    try {
      const res = await getTableGroups(selectedShopId, effectiveBranchId);
      setTableGroups(res.data?.data || []);
    } catch {
      setTableGroups([]);
    }
  }, [selectedShopId, effectiveBranchId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (!Array.isArray(groupSelectedIds) || groupSelectedIds.length < 2) {
      toast.error("Chọn ít nhất 2 bàn để ghép.");
      return;
    }
    try {
      await createTableGroup(selectedShopId, effectiveBranchId, {
        shopId: selectedShopId,
        branchId: effectiveBranchId,
        tableIds: groupSelectedIds,
      });
      toast.success("Đã ghép bàn.");
      setGroupDialogOpen(false);
      setGroupSelectedIds([]);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể ghép bàn.");
    }
  }, [selectedShopId, effectiveBranchId, groupSelectedIds, fetchGroups]);

  const handleUngroup = useCallback(
    async (groupId) => {
      if (!selectedShopId || !effectiveBranchId) return;
      try {
        await deleteTableGroup(groupId, selectedShopId, effectiveBranchId);
        toast.success("Đã giải nhóm bàn.");
        fetchGroups();
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể giải nhóm.");
      }
    },
    [selectedShopId, effectiveBranchId, fetchGroups],
  );

  const handleSplit = useCallback(async () => {
    if (!selectedShopId || !activeOrderId) return;
    const itemsToMove = cart
      .map((it) => {
        const q = Number(splitQtyByLineKey[it.lineKey] ?? 0);
        if (!q || q <= 0) return null;
        return {
          productId: it.productId,
          ...(it.variantId ? { variantId: it.variantId } : {}),
          quantity: q,
        };
      })
      .filter(Boolean);
    if (itemsToMove.length === 0) {
      toast.error("Chọn số lượng món cần tách.");
      return;
    }
    try {
      const payload = {
        toTableId:
          splitToTableId && splitToTableId !== "none" ? splitToTableId : null,
        itemsToMove,
      };
      const res = await splitOrder(activeOrderId, selectedShopId, payload);
      const data = res.data?.data;
      const src = data?.source;
      updateActiveTab({
        orderId: src?.id || activeOrderId,
        cart: cartFromOrderItems(src?.items),
        note: src?.note || "",
        tableId: src?.tableId || selectedTableId,
      });
      toast.success("Đã tách món sang đơn mới.");
      setSplitDialogOpen(false);
      setSplitToTableId("none");
      setSplitQtyByLineKey({});
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tách món.");
    }
  }, [
    selectedShopId,
    activeOrderId,
    cart,
    splitQtyByLineKey,
    splitToTableId,
    updateActiveTab,
    selectedTableId,
    fetchData,
  ]);

  const creatingOrderRef = React.useRef(false);

  // Auto-create server order when table selected + first items appear
  useEffect(() => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (activeOrderId) return;
    if (creatingOrderRef.current) return;
    if (!selectedTableId || selectedTableId === "none") return;
    if (!Array.isArray(cart) || cart.length === 0) return;

    creatingOrderRef.current = true;
    (async () => {
      try {
        const orderData = {
          shopId: selectedShopId,
          branchId: effectiveBranchId,
          tableId: selectedTableId,
          note: note || null,
          customerId: selectedCustomer?.id || null,
          pointsToRedeem:
            selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : null,
          items: cart.map((item) => ({
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantity: item.quantity,
          })),
        };
        const res = await createOrder(selectedShopId, effectiveBranchId, orderData);
        const created = res.data?.data;
        if (created?.id) {
          updateActiveTab({ orderId: created.id });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tạo đơn đang mở.");
      } finally {
        creatingOrderRef.current = false;
      }
    })();
  }, [
    selectedShopId,
    effectiveBranchId,
    activeOrderId,
    selectedTableId,
    cart,
    note,
    selectedCustomer,
    pointsToRedeem,
    updateActiveTab,
  ]);

  const syncTimerRef = React.useRef(null);

  // Debounced sync updates for open server order (edit items before payment)
  useEffect(() => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (!activeOrderId) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          tableId:
            selectedTableId && selectedTableId !== "none" ? selectedTableId : null,
          note: note || null,
          items: cart.map((item) => ({
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantity: item.quantity,
          })),
        };
        await updateOrder(activeOrderId, selectedShopId, payload);
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể cập nhật đơn.");
      }
    }, 650);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [activeOrderId, selectedShopId, effectiveBranchId, selectedTableId, note, cart]);

  const handleHoldOrder = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (!Array.isArray(cart) || cart.length === 0) return;

    try {
      if (!activeOrderId) {
        const orderData = {
          shopId: selectedShopId,
          branchId: effectiveBranchId,
          tableId:
            selectedTableId && selectedTableId !== "none" ? selectedTableId : null,
          note: note || null,
          customerId: selectedCustomer?.id || null,
          pointsToRedeem:
            selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : null,
          items: cart.map((item) => ({
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantity: item.quantity,
          })),
        };
        const res = await createOrder(selectedShopId, effectiveBranchId, orderData);
        const created = res.data?.data;
        if (created?.id) {
          updateActiveTab({ orderId: created.id });
          toast.success("Đã lưu đơn (đang mở).");
        }
        return;
      }

      // Force immediate sync
      const payload = {
        tableId:
          selectedTableId && selectedTableId !== "none" ? selectedTableId : null,
        note: note || null,
        items: cart.map((item) => ({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity,
        })),
      };
      await updateOrder(activeOrderId, selectedShopId, payload);
      toast.success("Đã lưu thay đổi đơn.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu đơn.");
    }
  }, [
    selectedShopId,
    effectiveBranchId,
    cart,
    activeOrderId,
    selectedTableId,
    note,
    selectedCustomer,
    pointsToRedeem,
    updateActiveTab,
  ]);

  const handleSendKitchen = useCallback(async () => {
    if (!selectedShopId || !activeOrderId) return;
    try {
      await updateOrderStatus(activeOrderId, selectedShopId, "CONFIRMED");
      toast.success("Đã gửi bếp (xác nhận đơn).");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi bếp.");
    }
  }, [selectedShopId, activeOrderId]);

  const customerSearchTimer = React.useRef(null);
  const handleCustomerSearch = useCallback(
    (keyword) => {
      setCustomerResults([]);
      if (customerSearchTimer.current)
        clearTimeout(customerSearchTimer.current);
      if (!keyword || keyword.trim().length < 2) return;
      customerSearchTimer.current = setTimeout(async () => {
        setCustomerSearching(true);
        try {
          const res = await getCustomers(selectedShopId, {
            keyword: keyword.trim(),
            size: 8,
          });
          const data = res.data?.data;
          const list = data?.content ?? (Array.isArray(data) ? data : []);
          setCustomerResults(list);
        } catch {
          setCustomerResults([]);
        } finally {
          setCustomerSearching(false);
        }
      }, 350);
    },
    [selectedShopId],
  );

  const handleSelectCustomer = useCallback(
    async (customer) => {
      setCustomerResults([]);
      try {
        const res = await getCustomerPoints(customer.id, selectedShopId);
        const points = res.data?.data ?? customer.loyaltyPoints ?? 0;
        setSelectedCustomer({ ...customer, loyaltyPoints: points });
      } catch {
        setSelectedCustomer(customer);
      }
    },
    [selectedShopId, setSelectedCustomer],
  );

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerResults([]);
    setPointsToRedeem(0);
  }, [setSelectedCustomer, setPointsToRedeem]);

  const { promoMap, activePromotions } = useMemo(
    () => buildPromotionMap(promotions, effectiveBranchId),
    [promotions, effectiveBranchId],
  );

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return [ALL_CATEGORY, ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== ALL_CATEGORY && p.category !== selectedCategory)
        return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  const availableTables = useMemo(
    () => tables.filter((t) => t.status === "AVAILABLE"),
    [tables],
  );

  // Auto-load other tables in the same group (preload open orders into tabs)
  const loadedGroupRef = React.useRef("");
  useEffect(() => {
    if (!selectedShopId) return;
    if (!effectiveBranchId) return;
    if (!activeGroup?.id) return;
    if (!selectedTableId || selectedTableId === "none") return;
    const key = `${activeGroup.id}__${selectedTableId}__${activeTabId}`;
    if (loadedGroupRef.current === key) return;
    loadedGroupRef.current = key;

    const otherTableIds = (activeGroup.tableIds || []).filter(
      (id) => id && id !== selectedTableId,
    );
    if (otherTableIds.length === 0) return;

    let alive = true;
    (async () => {
      for (const tid of otherTableIds) {
        if (!alive) return;
        try {
          const res = await getCurrentOrderByTable(selectedShopId, tid);
          const order = res.data?.data;
          if (!order?.id) continue;
          const exists = orderTabs.some((t) => t.orderId === order.id);
          if (exists) continue;

          const newTabId = nextTabIdRef.current++;
          setOrderTabs((prev) => [
            ...prev,
            {
              ...createEmptyTab(newTabId),
              orderId: order.id,
              tableId: tid,
              cart: cartFromOrderItems(order.items),
              note: order.note || "",
              customer: order.customerId
                ? {
                    id: order.customerId,
                    name: order.customerName,
                    phone: order.customerPhone,
                  }
                : null,
              pointsToRedeem: order.pointsRedeemed ?? 0,
            },
          ]);
        } catch {
          // ignore per-table failure
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    selectedShopId,
    effectiveBranchId,
    activeGroup,
    selectedTableId,
    orderTabs,
    activeTabId,
  ]);

  const addToCart = useCallback(
    (product, variantId) => {
      const hasVars = hasBranchVariants(product);
      const branchVariant =
        hasVars && variantId
          ? product.branchVariants.find((v) => v.variantId === variantId)
          : null;
      if (hasVars && (!variantId || !branchVariant)) {
        toast.error("Chọn biến thể hợp lệ.");
        return;
      }

      const basePrice = hasVars
        ? branchVariant.price > 0
          ? branchVariant.price
          : product.price
        : product.price;
      const maxStock = product.trackInventory
        ? hasVars
          ? branchVariant.quantity
          : (product.quantity ?? 0)
        : null;

      const prev = cartRef.current;
      const lineMatch = (item) =>
        hasVars
          ? item.productId === product.productId && item.variantId === variantId
          : item.productId === product.productId && !item.variantId;

      const existing = prev.find(lineMatch);
      if (existing) {
        if (maxStock != null && existing.quantity >= maxStock) {
          toast.error("Không đủ tồn kho.");
          return;
        }
        setCart(
          prev.map((item) =>
            lineMatch(item) ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        );
        return;
      }

      if (maxStock != null && maxStock < 1) {
        toast.error("Hết hàng.");
        return;
      }

      const promo = getBestPromo(promoMap, product.productId);
      const discountedPrice = calcDiscountedPrice(basePrice, promo);
      const hasDiscount = promo && discountedPrice < basePrice;
      const vName = hasVars ? variantCatalogName(product, variantId) : "";
      const lineKey = hasVars
        ? `${product.productId}__${variantId}`
        : product.productId;

      setCart([
        ...prev,
        {
          lineKey,
          productId: product.productId,
          variantId: hasVars ? variantId : null,
          branchProductId: product.id,
          productName: vName ? `${product.name} — ${vName}` : product.name,
          originalPrice: basePrice,
          price: hasDiscount ? discountedPrice : basePrice,
          hasDiscount: !!hasDiscount,
          promoLabel: hasDiscount ? formatDiscount(promo) : null,
          promoName: promo?.name || null,
          image: product.images?.[0] || null,
          quantity: 1,
          trackInventory: !!product.trackInventory,
          maxStock,
        },
      ]);
    },
    [promoMap, setCart],
  );

  const updateQuantity = useCallback(
    (lineKey, delta) => {
      const prev = cartRef.current;
      const item = prev.find((i) => i.lineKey === lineKey);
      if (!item) return;
      const nextQty = item.quantity + delta;
      if (
        delta > 0 &&
        item.trackInventory &&
        item.maxStock != null &&
        nextQty > item.maxStock
      ) {
        toast.error("Không đủ tồn kho.");
        return;
      }
      setCart(
        prev
          .map((it) => {
            if (it.lineKey !== lineKey) return it;
            return { ...it, quantity: Math.max(0, nextQty) };
          })
          .filter((it) => it.quantity > 0),
      );
    },
    [setCart],
  );

  const removeFromCart = useCallback(
    (lineKey) => {
      setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
    },
    [setCart],
  );

  const clearCart = useCallback(() => {
    updateActiveTab({
      cart: [],
      tableId: "",
      note: "",
      customer: null,
      pointsToRedeem: 0,
    });
    setCustomerResults([]);
  }, [updateActiveTab]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const totalSavings = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item.hasDiscount
            ? (item.originalPrice - item.price) * item.quantity
            : 0),
        0,
      ),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const totalAfterPoints = useMemo(
    () => Math.max(0, subtotal - pointsToRedeem * 1000),
    [subtotal, pointsToRedeem],
  );

  const [taxPreview, setTaxPreview] = useState(null);
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);

  useEffect(() => {
    if (!effectiveBranchId || !selectedShopId || totalAfterPoints <= 0) {
      setTaxPreview(null);
      setTaxPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setTaxPreviewLoading(true);
      previewOrderTax(selectedShopId, effectiveBranchId, totalAfterPoints)
        .then((res) => {
          if (!cancelled) {
            setTaxPreview(res.data?.data ?? null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTaxPreview(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setTaxPreviewLoading(false);
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedShopId, effectiveBranchId, totalAfterPoints]);

  const draftOrderForPreview = useMemo(
    () =>
      cart.length === 0
        ? null
        : buildDraftOrderForInvoice({
            cart,
            subtotal,
            taxPreview,
            pointsToRedeem,
            note,
            paymentMethod,
          }),
    [cart, subtotal, taxPreview, pointsToRedeem, note, paymentMethod],
  );

  const openCheckoutInvoicePreview = useCallback(() => {
    setPreviewPrintedAt(new Date().toISOString());
    setInvoicePreviewOpen(true);
  }, []);

  const draftInvoiceMeta = useMemo(() => {
    const branchName =
      branches.find((b) => b.id === effectiveBranchId)?.name || null;
    const tableName =
      selectedTableId && selectedTableId !== "none"
        ? tables.find((t) => t.id === selectedTableId)?.name || null
        : null;
    return {
      shopName: selectedShop?.name,
      shopAddress: selectedShop?.address,
      shopPhone: selectedShop?.phone,
      branchName,
      customerName: selectedCustomer?.name || null,
      tableName,
      paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    };
  }, [
    branches,
    effectiveBranchId,
    selectedTableId,
    tables,
    selectedShop,
    selectedCustomer,
    paymentMethod,
  ]);

  const handlePostSaleCustomerSave = useCallback(async () => {
    if (!postSaleOrderId || !selectedShopId) return;
    const name = postSaleName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên khách hàng.");
      return;
    }
    setPostSaleSaving(true);
    try {
      const res = await createCustomer(selectedShopId, {
        name,
        phone: postSalePhone.trim() || null,
        email: null,
        address: null,
        note: null,
        branchId: effectiveBranchId || null,
      });
      const newId = res.data?.data?.id;
      if (!res.data?.success || !newId) {
        toast.error(res.data?.message || "Không tạo được khách hàng.");
        return;
      }
      await patchOrderFulfillment(postSaleOrderId, selectedShopId, {
        customerId: newId,
      });
      toast.success("Đã tạo khách và gắn vào đơn hàng.");
      setPostSaleOpen(false);
      setPostSaleOrderId(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Không hoàn tất thao tác.");
    } finally {
      setPostSaleSaving(false);
    }
  }, [
    postSaleOrderId,
    selectedShopId,
    effectiveBranchId,
    postSaleName,
    postSalePhone,
  ]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const hadNoCustomer = !selectedCustomer;
      const orderData = {
        shopId: selectedShopId,
        branchId: effectiveBranchId,
        tableId:
          selectedTableId && selectedTableId !== "none"
            ? selectedTableId
            : null,
        note: note || null,
        customerId: selectedCustomer?.id || null,
        pointsToRedeem:
          selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : null,
        items: cart.map((item) => ({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity,
        })),
        ...(paymentMethod === "ShipCOD"
          ? { checkoutPaymentMethod: "ShipCOD" }
          : {}),
      };

      const res = await createOrder(
        selectedShopId,
        effectiveBranchId,
        orderData,
      );
      let finalOrder = res.data?.data;

      const deferPayment = paymentMethod === "ShipCOD";
      if (paymentMethod && finalOrder?.id && !deferPayment) {
        try {
          const payRes = await confirmPayment(
            finalOrder.id,
            selectedShopId,
            `POS-${Date.now()}`,
            paymentMethod,
          );
          finalOrder = payRes.data?.data ?? finalOrder;
        } catch {
          toast.info("Đơn hàng đã tạo nhưng chưa thanh toán");
        }
      }

      const branchName =
        branches.find((b) => b.id === effectiveBranchId)?.name || null;
      const tableName =
        selectedTableId && selectedTableId !== "none"
          ? tables.find((t) => t.id === selectedTableId)?.name || null
          : null;

      setInvoicePayload({
        order: finalOrder,
        printedAt: new Date().toISOString(),
        shopName: selectedShop?.name,
        shopAddress: selectedShop?.address,
        shopPhone: selectedShop?.phone,
        branchName,
        customerName: selectedCustomer?.name || null,
        tableName,
        paymentMethodLabel: getPaymentMethodLabel(
          finalOrder?.paymentMethod || paymentMethod,
        ),
      });
      setInvoiceOpen(true);

      toast.success(
        deferPayment
          ? "Đã tạo đơn — chờ thu COD. Xác nhận đã thu tiền trong mục Đơn hàng."
          : "Đơn hàng đã được tạo thành công!",
      );
      setCheckoutOpen(false);
      if (orderTabs.length > 1) {
        closeTab(activeTabId);
      } else {
        clearCart();
      }
      fetchData();

      if (hadNoCustomer && finalOrder?.id) {
        setPostSaleOrderId(finalOrder.id);
        setPostSaleName("");
        setPostSalePhone("");
        setPostSaleOpen(true);
      }
    } catch (err) {
      console.error("Order creation failed", err);
      const msg = err.response?.data?.message || "Không thể tạo đơn hàng";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!effectiveBranchId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Vui lòng chọn chi nhánh</p>
          <p className="text-sm text-muted-foreground">
            Chọn chi nhánh từ thanh tiêu đề để bắt đầu bán hàng
          </p>
          {branches.length > 0 && (
            <Select value="" onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[240px] mx-auto">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }

  const tabBarProps = {
    tabs: orderTabs,
    activeTabId,
    onSelect: switchTab,
    onAdd: addTab,
    onClose: closeTab,
    tables,
  };

  const cartPanelProps = {
    cart,
    totalItems,
    subtotal,
    totalSavings,
    note,
    setNote,
    selectedTableId,
    setSelectedTableId,
    availableTables,
    updateQuantity,
    removeFromCart,
    clearCart,
    selectedCustomer,
    onCustomerSearch: handleCustomerSearch,
    onSelectCustomer: handleSelectCustomer,
    onClearCustomer: handleClearCustomer,
    customerResults,
    customerSearching,
    pointsToRedeem,
    taxPreview,
    taxPreviewLoading,
    showTableSelect: tables.length > 0,
    onHoldOrder: handleHoldOrder,
    onSendKitchen: handleSendKitchen,
    holdDisabled: !effectiveBranchId || cart.length === 0 || submitting,
    sendKitchenDisabled: !activeOrderId || cart.length === 0 || submitting,
    onOpenGroupDialog: () => {
      setGroupDialogOpen(true);
      setGroupSelectedIds([]);
    },
    onOpenSplitDialog: () => {
      setSplitDialogOpen(true);
      setSplitToTableId("none");
      setSplitQtyByLineKey({});
    },
    splitDisabled: !activeOrderId || cart.length === 0 || submitting,
    activeGroup,
    tables,
    onQuickSwitchTable: (tid) => setSelectedTableId(tid),
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Mobile: Category horizontal scroll */}
      <div className="lg:hidden border-b overflow-x-auto">
        <div className="flex items-center gap-1 p-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {cat === ALL_CATEGORY ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Category sidebar */}
      <aside className="hidden lg:flex w-48 shrink-0 border-r bg-muted/30 flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Danh mục
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {cat === ALL_CATEGORY ? "Tất cả" : cat}
              </button>
            ))}
          </div>
        </ScrollArea>

        {activePromotions.length > 0 && (
          <div className="border-t p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Khuyến mãi
            </p>
            <div className="space-y-1.5">
              {activePromotions.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-1.5 text-[11px]"
                >
                  <Tag className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate">
                      {p.name}
                    </p>
                    <p className="text-emerald-600 font-semibold">
                      {formatDiscount(p)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Center: Product grid */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="p-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm món ăn, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="shrink-0">
            {filteredProducts.length} sản phẩm
          </Badge>
          {activePromotions.length > 0 && (
            <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
              <Tag className="h-3 w-3" />
              {activePromotions.length} KM
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không tìm thấy sản phẩm</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3">
              {filteredProducts.map((product) => {
                const inCartQty = cart
                  .filter((c) => c.productId === product.productId)
                  .reduce((s, c) => s + c.quantity, 0);
                const promo = getBestPromo(promoMap, product.productId);
                const discountedPrice = calcDiscountedPrice(
                  product.price,
                  promo,
                );
                const hasPromo = promo && discountedPrice < product.price;

                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden relative group"
                    onClick={() => {
                      if (hasBranchVariants(product)) {
                        if (product.branchVariants.length === 1) {
                          addToCart(
                            product,
                            product.branchVariants[0].variantId,
                          );
                        } else {
                          setVariantPickerProduct(product);
                        }
                      } else {
                        addToCart(product, null);
                      }
                    }}
                  >
                    <div className="aspect-square bg-muted/50 relative">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {hasPromo && (
                        <Badge className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 gap-0.5">
                          <Percent className="h-2.5 w-2.5" />
                          {formatDiscount(promo)}
                        </Badge>
                      )}
                      {inCartQty > 0 && (
                        <Badge className="absolute top-1.5 right-1.5 h-6 min-w-6 justify-center text-xs">
                          {inCartQty}
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      {hasPromo ? (
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-sm font-bold text-emerald-600">
                            {discountedPrice.toLocaleString("vi-VN")} ₫
                          </span>
                          <span className="text-[10px] line-through text-muted-foreground">
                            {product.price.toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-primary mt-1">
                          {product.price?.toLocaleString("vi-VN")} ₫
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Mobile: Floating cart button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
            {orderTabs.length > 1 && (
              <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {orderTabs.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop: Cart panel */}
      <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 border-l bg-card flex-col">
        <OrderTabBar {...tabBarProps} />
        <CartPanel
          {...cartPanelProps}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </aside>

      {/* Mobile: Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Đơn hàng
              {totalItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalItems}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <OrderTabBar {...tabBarProps} />
          <CartPanel
            {...cartPanelProps}
            onCheckout={() => {
              setCartOpen(false);
              setCheckoutOpen(true);
            }}
            hideHeader
          />
        </SheetContent>
      </Sheet>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Xác nhận thanh toán
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.lineKey}
                  className="flex justify-between px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span>
                      {item.productName}{" "}
                      <span className="text-muted-foreground">
                        x{item.quantity}
                      </span>
                    </span>
                    {item.hasDiscount && (
                      <span className="ml-1.5 text-[10px] text-emerald-600 font-medium">
                        {item.promoLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {item.hasDiscount && (
                      <span className="text-xs line-through text-muted-foreground mr-1.5">
                        {(item.originalPrice * item.quantity).toLocaleString(
                          "vi-VN",
                        )}
                        ₫
                      </span>
                    )}
                    <span className="font-medium tabular-nums">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between items-center px-1 text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tổng tiết kiệm
                </span>
                <span className="text-emerald-600 font-semibold tabular-nums">
                  -{totalSavings.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <span className="text-sm text-muted-foreground">Tạm tính</span>
              <span className="text-sm font-semibold tabular-nums">
                {subtotal.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            {pointsToRedeem > 0 && (
              <div className="flex justify-between items-center px-1 text-sm">
                <span className="text-muted-foreground">Giảm điểm</span>
                <span className="text-emerald-600 font-semibold tabular-nums">
                  -{(pointsToRedeem * 1000).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            )}

            <div className="px-1 space-y-2">
              <PosTaxBreakdown
                loading={taxPreviewLoading}
                taxPreview={taxPreview}
              />
              {!taxPreviewLoading && !taxPreview && totalAfterPoints > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {totalAfterPoints.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              )}
            </div>

            {selectedTableId && selectedTableId !== "none" && (
              <div className="text-sm text-muted-foreground px-1">
                Bàn:{" "}
                {tables.find((t) => t.id === selectedTableId)?.name ||
                  selectedTableId}
              </div>
            )}

            {selectedCustomer && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {selectedCustomer.name}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {(selectedCustomer.loyaltyPoints ?? 0).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    điểm
                  </span>
                </div>
                {(selectedCustomer.loyaltyPoints ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Coins className="h-3 w-3" /> Dùng điểm (1 điểm =
                        1.000₫)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={selectedCustomer.loyaltyPoints}
                        value={pointsToRedeem || ""}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(
                              selectedCustomer.loyaltyPoints,
                              parseInt(e.target.value) || 0,
                            ),
                          );
                          setPointsToRedeem(v);
                        }}
                        placeholder="0"
                        className="h-8 text-xs w-24"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs shrink-0"
                        onClick={() =>
                          setPointsToRedeem(selectedCustomer.loyaltyPoints)
                        }
                      >
                        Dùng hết
                      </Button>
                      {pointsToRedeem > 0 && (
                        <span className="text-xs text-emerald-600 font-medium shrink-0">
                          -{(pointsToRedeem * 1000).toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Phương thức thanh toán</p>
              {paymentMethod === "ShipCOD" && (
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  Ship COD: đơn được tạo ở trạng thái chờ thu tiền khi giao. Sau
                  khi thu, vào <span className="font-medium">Đơn hàng</span> →
                  Thanh toán để cập nhật.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <Button
                      key={pm.value}
                      variant={
                        paymentMethod === pm.value ? "default" : "outline"
                      }
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => setPaymentMethod(pm.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {pm.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={cart.length === 0 || submitting}
              onClick={openCheckoutInvoicePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Xem trước hóa đơn
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCheckout} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xem trước hóa đơn (dự thảo, trước khi xác nhận) */}
      <Dialog open={invoicePreviewOpen} onOpenChange={setInvoicePreviewOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Xem trước hóa đơn
            </DialogTitle>
            <DialogDescription>
              Bản dự thảo — mã đơn hàng và thời gian thật sẽ có sau khi bạn xác
              nhận thanh toán.
            </DialogDescription>
          </DialogHeader>
          {taxPreviewLoading && totalAfterPoints > 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-500 px-6 pb-1 shrink-0">
              Đang cập nhật thuế — tổng thanh toán trên hóa đơn có thể thay đổi
              vài giây.
            </p>
          ) : null}
          <ScrollArea className="flex-1 min-h-0 max-h-[55vh] px-6">
            <div className="pb-4">
              {draftOrderForPreview && previewPrintedAt ? (
                <PosInvoiceReceipt
                  {...draftInvoiceMeta}
                  order={draftOrderForPreview}
                  printedAt={previewPrintedAt}
                  isDraft
                />
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setInvoicePreviewOpen(false)}
            >
              Đóng
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!draftOrderForPreview || !previewPrintedAt) return;
                printPosInvoiceReceipt({
                  ...draftInvoiceMeta,
                  order: draftOrderForPreview,
                  printedAt: previewPrintedAt,
                  isDraft: true,
                });
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              In bản xem trước
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hóa đơn sau thanh toán — xem trước khi in */}
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
              Xem trước hóa đơn
            </DialogTitle>
            <DialogDescription>
              Kiểm tra nội dung, sau đó chọn In hóa đơn.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 max-h-[55vh] px-6">
            <div className="pb-4">
              {invoicePayload?.order ? (
                <PosInvoiceReceipt
                  shopName={invoicePayload.shopName}
                  shopAddress={invoicePayload.shopAddress}
                  shopPhone={invoicePayload.shopPhone}
                  branchName={invoicePayload.branchName}
                  order={invoicePayload.order}
                  customerName={invoicePayload.customerName}
                  tableName={invoicePayload.tableName}
                  paymentMethodLabel={invoicePayload.paymentMethodLabel}
                  printedAt={invoicePayload.printedAt}
                />
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
              Đóng
            </Button>
            <Button
              onClick={() => {
                if (!invoicePayload?.order) return;
                printPosInvoiceReceipt({
                  shopName: invoicePayload.shopName,
                  shopAddress: invoicePayload.shopAddress,
                  shopPhone: invoicePayload.shopPhone,
                  branchName: invoicePayload.branchName,
                  order: invoicePayload.order,
                  customerName: invoicePayload.customerName,
                  tableName: invoicePayload.tableName,
                  paymentMethodLabel: invoicePayload.paymentMethodLabel,
                  printedAt: invoicePayload.printedAt,
                  isDraft: false,
                });
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              In hóa đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={postSaleOpen}
        onOpenChange={(v) => {
          if (!v) {
            setPostSaleOpen(false);
            setPostSaleOrderId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Lưu khách cho đơn vừa bán
            </DialogTitle>
            <DialogDescription>
              Điểm tích luỹ chỉ áp dụng khi đã chọn khách trước khi thanh toán.
              Bạn có thể bỏ qua bước này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Tên khách *</Label>
              <Input
                className="h-9"
                value={postSaleName}
                onChange={(e) => setPostSaleName(e.target.value)}
                placeholder="Họ tên"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Số điện thoại</Label>
              <Input
                className="h-9"
                value={postSalePhone}
                onChange={(e) => setPostSalePhone(e.target.value)}
                placeholder="Tuỳ chọn"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPostSaleOpen(false);
                setPostSaleOrderId(null);
              }}
            >
              Bỏ qua
            </Button>
            <Button
              type="button"
              onClick={handlePostSaleCustomerSave}
              disabled={postSaleSaving}
            >
              {postSaleSaving && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Tạo khách & gắn đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ghép bàn (TableGroup) */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ghép bàn</DialogTitle>
            <DialogDescription>
              Ghép nhiều bàn thành một nhóm để dễ quản lý (không gộp đơn).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-2 max-h-64 overflow-y-auto">
              {tables.map((t) => {
                const checked = groupSelectedIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer"
                  >
                    <span className="truncate">
                      {t.name} {t.capacity ? `(${t.capacity} chỗ)` : ""}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setGroupSelectedIds((prev) =>
                          on ? [...prev, t.id] : prev.filter((x) => x !== t.id),
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>

            {tableGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Nhóm hiện có</p>
                <div className="space-y-2">
                  {tableGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {g.name || `Nhóm ${g.id?.slice?.(-6) || ""}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(g.tableIds || [])
                            .map((id) => tables.find((t) => t.id === id)?.name || id)
                            .join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUngroup(g.id)}
                      >
                        Giải nhóm
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handleCreateGroup}>Tạo nhóm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tách món sang đơn mới */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tách món</DialogTitle>
            <DialogDescription>
              Chọn số lượng cần tách sang đơn mới (có thể gắn bàn đích).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Bàn đích (tuỳ chọn)</Label>
              <Select value={splitToTableId} onValueChange={setSplitToTableId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn bàn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn bàn</SelectItem>
                  {tables
                    .filter((t) => t.id !== selectedTableId)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-2 max-h-64 overflow-y-auto space-y-2">
              {cart.map((it) => {
                const max = it.quantity ?? 0;
                const val = splitQtyByLineKey[it.lineKey] ?? "";
                return (
                  <div
                    key={it.lineKey}
                    className="flex items-center justify-between gap-2 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{it.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Tối đa: {max}
                      </p>
                    </div>
                    <Input
                      className="h-8 w-20 text-right"
                      value={val}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = raw === "" ? "" : Math.max(0, Number(raw));
                        setSplitQtyByLineKey((prev) => ({
                          ...prev,
                          [it.lineKey]: n === "" ? "" : Math.min(max, n),
                        }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handleSplit}>Tách</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!variantPickerProduct}
        onOpenChange={(v) => {
          if (!v) setVariantPickerProduct(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Chọn biến thể</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {variantPickerProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {variantPickerProduct?.branchVariants?.map((bv) => {
              const label = variantCatalogName(
                variantPickerProduct,
                bv.variantId,
              );
              const stockLabel =
                variantPickerProduct.trackInventory === false
                  ? ""
                  : `Tồn: ${(bv.quantity ?? 0).toLocaleString("vi-VN")}`;
              const price =
                bv.price > 0 ? bv.price : (variantPickerProduct.price ?? 0);
              return (
                <button
                  key={bv.variantId}
                  type="button"
                  className="w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    addToCart(variantPickerProduct, bv.variantId);
                    setVariantPickerProduct(null);
                  }}
                >
                  <span className="font-medium truncate min-w-0">{label}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
                    {stockLabel}
                    {stockLabel ? " · " : ""}
                    {price.toLocaleString("vi-VN")}₫
                  </span>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVariantPickerProduct(null)}
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosPage;
