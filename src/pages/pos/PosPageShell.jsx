import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  UtensilsCrossed,
  X,
  Receipt,
  Tag,
  Percent,
  UserRound,
  Star,
  Coins,
  Loader2,
  CheckCircle2,
  Eye,
  Printer,
  ChevronsLeftRight,
  ImagePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { PosInvoiceReceipt } from "../../components/pos/PosInvoiceReceipt";
import { printPosInvoiceReceipt } from "../../components/pos/printPosInvoiceReceipt";
import { OrderTabBar } from "./OrderTabBar";
import { CartPanel } from "./CartPanel";
import { PosTaxBreakdown } from "./PosTaxBreakdown";
import { ALL_CATEGORY, PAYMENT_METHODS } from "./posConstants";
import {
  formatDiscount,
  getWinningPromo,
  calcDiscountedPrice,
} from "./posPromotionUtils";
import {
  activeToppings,
  hasBranchVariants,
  variantCatalogName,
} from "./posProductUtils";

function ToppingPickerBody({ product, onCancel, onConfirm }) {
  const tops = activeToppings(product);
  const [sel, setSel] = React.useState([]);
  const toggle = (id) => {
    setSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  return (
    <>
      <div className="space-y-2 max-h-72 overflow-y-auto py-1">
        {tops.map((t) => (
          <label
            key={t.toppingId}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={sel.includes(t.toppingId)}
                onChange={() => toggle(t.toppingId)}
              />
              <span className="font-medium truncate">{t.name}</span>
            </span>
            <span className="tabular-nums text-muted-foreground text-xs shrink-0">
              +
              {Number(t.extraPrice ?? 0).toLocaleString("vi-VN")}
              ₫
            </span>
          </label>
        ))}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" type="button" onClick={onCancel}>
          Bỏ qua
        </Button>
        <Button type="button" onClick={() => onConfirm(sel)}>
          Thêm vào giỏ
        </Button>
      </DialogFooter>
    </>
  );
}
import { cn } from "@/lib/utils";

export function PosPageShell(props) {
  const [cartAsideWide, setCartAsideWide] = useState(false);
  const transferProofInputRef = useRef(null);

  const {
    activePromotions,
    cancelToppingPicker,
    cart,
    confirmToppingPickerSelection,
    cartOpen,
    cartPanelProps,
    categories,
    checkoutOpen,
    draftInvoiceMeta,
    displayOrderCode,
    draftOrderForPreview,
    filteredProducts,
    groupDialogOpen,
    groupSelectedIds,
    handleCheckout,
    handleConfirmMoveTable,
    handleCreateGroup,
    handlePostSaleCustomerSave,
    handleSplit,
    handleUngroup,
    holdSuccessMessage,
    holdSuccessOpen,
    invoiceOpen,
    invoicePayload,
    invoicePreviewOpen,
    loading,
    moveTableOpen,
    moveToTableId,
    openCheckoutInvoicePreview,
    openPosCheckout,
    shopPosWriteBlocked,
    openOrderByCode,
    orderLookupInput,
    orderLookupSubmitting,
    orderTabs,
    paymentMethod,
    transferPaymentProofFile,
    setTransferPaymentProofFile,
    pointsToRedeem,
    postSaleName,
    postSaleOpen,
    postSalePhone,
    postSaleSaving,
    previewPrintedAt,
    promoMap,
    queueAddProductWithToppings,
    searchTerm,
    selectedCategory,
    selectedCustomer,
    selectedTableId,
    setCartOpen,
    setCheckoutOpen,
    setCustomerResults,
    setGroupDialogOpen,
    setGroupSelectedIds,
    setHoldSuccessOpen,
    setInvoiceOpen,
    setInvoicePayload,
    setInvoicePreviewOpen,
    setOrderLookupInput,
    setMoveTableOpen,
    setMoveToTableId,
    setPaymentMethod,
    setPointsToRedeem,
    setPostSaleName,
    setPostSaleOpen,
    setPostSaleOrderId,
    setPostSalePhone,
    setSearchTerm,
    setSelectedCategory,
    setSplitDialogOpen,
    setSplitQtyByLineKey,
    setSplitToTableId,
    setVariantPickerProduct,
    splitDialogOpen,
    splitQtyByLineKey,
    splitToTableId,
    submitting,
    subtotal,
    tabBarProps,
    tableGroups,
    tables,
    taxPreview,
    taxPreviewLoading,
    toppingPicker,
    totalAfterPoints,
    totalItems,
    totalSavings,
    updateActiveTab,
    variantPickerProduct,
  } = props;
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
        <div className="p-3 border-b flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 max-w-sm min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm món ăn, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="Mã đơn (VD: DH-...)"
                value={orderLookupInput}
                onChange={(e) => setOrderLookupInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    openOrderByCode(orderLookupInput);
                  }
                }}
                className="h-9 w-[9.5rem] text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 px-2.5 text-xs whitespace-nowrap"
                disabled={orderLookupSubmitting}
                onClick={() => openOrderByCode(orderLookupInput)}
              >
                {orderLookupSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Mở đơn"
                )}
              </Button>
            </div>
            {displayOrderCode && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-7 hidden xl:flex items-center max-w-[10rem] truncate"
                title={displayOrderCode}
              >
                {displayOrderCode}
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {filteredProducts.length} sản phẩm
          </Badge>
          {activePromotions.length > 0 && (
            <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40">
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
                const promo = getWinningPromo(
                  promoMap,
                  product.productId,
                  product.price,
                );
                const discountedPrice = calcDiscountedPrice(
                  product.price,
                  promo,
                );
                const hasPromo = promo && discountedPrice < product.price;

                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden relative group h-full flex flex-col gap-0 p-0 py-0 shadow-sm"
                    onClick={() => {
                      if (hasBranchVariants(product)) {
                        if (product.branchVariants.length === 1) {
                          queueAddProductWithToppings(
                            product,
                            product.branchVariants[0].variantId,
                          );
                        } else {
                          setVariantPickerProduct(product);
                        }
                      } else {
                        queueAddProductWithToppings(product, null);
                      }
                    }}
                  >
                    <div className="aspect-square w-full shrink-0 bg-muted/50 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
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
                    <div className="flex flex-1 flex-col gap-1 p-2 pt-2">
                      <p className="line-clamp-2 min-h-[2.625rem] text-xs font-medium leading-snug text-foreground">
                        {product.name}
                      </p>
                      {hasPromo ? (
                        <div className="mt-auto flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-emerald-600">
                            {discountedPrice.toLocaleString("vi-VN")} ₫
                          </span>
                          <span className="text-[10px] line-through text-muted-foreground">
                            {product.price.toLocaleString("vi-VN")}₫
                          </span>
                        </div>
                      ) : (
                        <p className="mt-auto text-sm font-bold text-primary">
                          {product.price?.toLocaleString("vi-VN")} ₫
                        </p>
                      )}
                      {product.sellByWeight &&
                        product.trackInventory !== false && (
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            Còn:{" "}
                            {(product.stockInBaseUnits ?? 0).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            {(() => {
                              const u = String(product.unit || "")
                                .trim()
                                .toLowerCase();
                              if (u === "kg" || u === "g") return "g";
                              if (u === "l" || u === "ml") return "ml";
                              return u || "";
                            })()}
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
      <aside
        className={cn(
          "hidden lg:flex shrink-0 border-l bg-card flex-col transition-[width] duration-200 ease-out",
          cartAsideWide
            ? "w-[min(32rem,44vw)] xl:w-[36rem]"
            : "w-80 xl:w-96",
        )}
      >
        <div className="flex items-center justify-end gap-0.5 px-1 py-0.5 border-b bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={cartAsideWide ? "Thu gọn giỏ hàng" : "Mở rộng giỏ hàng"}
            onClick={() => setCartAsideWide((w) => !w)}
          >
            <ChevronsLeftRight className="h-4 w-4" />
          </Button>
        </div>
        <OrderTabBar {...tabBarProps} />
        <CartPanel
          {...cartPanelProps}
          onCheckout={openPosCheckout}
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
              openPosCheckout();
            }}
            hideHeader
          />
        </SheetContent>
      </Sheet>

      {/* Hold/Save success dialog */}
      <Dialog open={holdSuccessOpen} onOpenChange={setHoldSuccessOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              Tạo đơn thành công
            </DialogTitle>
            <DialogDescription>
              {holdSuccessMessage || "Đã tạo đơn thành công."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHoldSuccessOpen(false)}
            >
              Tiếp tục bán hàng
            </Button>
            <Button
              type="button"
              onClick={() => {
                updateActiveTab({
                  orderId: null,
                  displayOrderCode: null,
                  cart: [],
                  tableId: "",
                  note: "",
                  customer: null,
                  guestName: "",
                  guestPhone: "",
                  pointsToRedeem: 0,
                });
                setCustomerResults([]);
                setHoldSuccessOpen(false);
              }}
            >
              Tạo đơn mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move table dialog (explicit action) */}
      <Dialog open={moveTableOpen} onOpenChange={setMoveTableOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi bàn</DialogTitle>
            <DialogDescription>
              Chọn bàn đích để chuyển đơn hiện tại sang bàn khác.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Bàn đích *</Label>
            <Select value={moveToTableId} onValueChange={setMoveToTableId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Chọn bàn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chọn bàn</SelectItem>
                {tables
                  .filter(
                    (t) => t.status === "AVAILABLE" && t.id !== selectedTableId,
                  )
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.capacity ? `(${t.capacity} chỗ)` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMoveTableOpen(false);
                setMoveToTableId("none");
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMoveTable}
              disabled={!moveToTableId || moveToTableId === "none"}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {paymentMethod === "Transfer" && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tuỳ chọn: đính kèm ảnh chụp màn hình chuyển khoản thành công để lưu
                  cùng đơn hàng.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={transferProofInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      setTransferPaymentProofFile(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => transferProofInputRef.current?.click()}
                  >
                    <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {transferPaymentProofFile
                        ? transferPaymentProofFile.name
                        : "Chọn ảnh chứng từ"}
                    </span>
                  </Button>
                  {transferPaymentProofFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground"
                      onClick={() => setTransferPaymentProofFile(null)}
                    >
                      Bỏ ảnh
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
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
            <Button
              onClick={handleCheckout}
              disabled={submitting || shopPosWriteBlocked}
            >
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
              Đóng
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
              Ghép nhiều bàn thành một nhóm để quản lý nhanh trên POS. Gộp hoá
              đơn chung (nếu cần) thực hiện ở nút{" "}
              <span className="font-medium">Gộp bill nhóm</span> trong giỏ hàng.
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
                            .map(
                              (id) =>
                                tables.find((t) => t.id === id)?.name || id,
                            )
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
                    queueAddProductWithToppings(
                      variantPickerProduct,
                      bv.variantId,
                    );
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

      <Dialog
        open={!!toppingPicker}
        onOpenChange={(v) => {
          if (!v) cancelToppingPicker();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Chọn topping</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {toppingPicker?.product?.name}
              {toppingPicker?.variantId
                ? ` — ${variantCatalogName(toppingPicker.product, toppingPicker.variantId)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {toppingPicker?.product ? (
            <ToppingPickerBody
              key={`${toppingPicker.product.productId}-${toppingPicker.variantId ?? ""}`}
              product={toppingPicker.product}
              onCancel={cancelToppingPicker}
              onConfirm={confirmToppingPickerSelection}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
