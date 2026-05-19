import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  UtensilsCrossed,
  X,
  Receipt,
  Tag,
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
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import { PosInvoiceReceipt } from "../../components/pos/PosInvoiceReceipt";
import { printPosInvoiceReceipt } from "../../components/pos/printPosInvoiceReceipt";
import { OrderTabBar } from "./OrderTabBar";
import { CartPanel } from "./CartPanel";
import { PosTaxBreakdown } from "./PosTaxBreakdown";
import { PosStatusBanner } from "./PosStatusBanner";
import { PosProductCard } from "./PosProductCard";
import { ALL_CATEGORY } from "./posConstants";
import { getPosPaymentMethods, posNumberLocale } from "../../utils/posHelpers";
import { formatDiscount } from "./posPromotionUtils";
import {
  activeToppings,
  hasBranchVariants,
  variantCatalogName,
} from "./posProductUtils";

function ToppingPickerBody({ product, onCancel, onConfirm }) {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);
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
        {tops.map((top) => (
          <label
            key={top.toppingId}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={sel.includes(top.toppingId)}
                onChange={() => toggle(top.toppingId)}
              />
              <span className="font-medium truncate">{top.name}</span>
            </span>
            <span className="tabular-nums text-muted-foreground text-xs shrink-0">
              +
              {Number(top.extraPrice ?? 0).toLocaleString(numberLocale)}
              ₫
            </span>
          </label>
        ))}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t("pages.pos.cart.toppingSkip")}
        </Button>
        <Button type="button" onClick={() => onConfirm(sel)}>
          {t("pages.pos.cart.toppingAddToCart")}
        </Button>
      </DialogFooter>
    </>
  );
}

export function PosPageShell(props) {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);
  const paymentMethods = useMemo(() => getPosPaymentMethods(t), [t]);

  const [cartAsideWide, setCartAsideWide] = useState(false);
  const transferProofInputRef = useRef(null);
  const searchInputRef = useRef(null);

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
    apiReachable,
    products,
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

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    counts.set(ALL_CATEGORY, products.length);
    for (const p of products) {
      if (p.category) {
        counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
      }
    }
    return counts;
  }, [products]);

  const selectedTableName =
    selectedTableId && selectedTableId !== "none"
      ? tables.find((tbl) => tbl.id === selectedTableId)?.name
      : null;

  const handleProductClick = useCallback(
    (product) => {
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
    },
    [queueAddProductWithToppings, setVariantPickerProduct],
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        e.target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const renderCategoryLabel = (cat) => {
    const label =
      cat === ALL_CATEGORY ? t("pages.pos.cart.allCategories") : cat;
    const count = categoryCounts.get(cat) ?? 0;
    return count > 0 ? `${label} (${count})` : label;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PosStatusBanner
        apiReachable={apiReachable}
        shopPosWriteBlocked={shopPosWriteBlocked}
      />
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
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
              {renderCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Category sidebar */}
      <aside className="hidden lg:flex w-48 shrink-0 border-r bg-muted/30 flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("pages.pos.cart.categoriesSidebar")}
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
                {renderCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </ScrollArea>

        {activePromotions.length > 0 && (
          <div className="border-t p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("pages.pos.cart.promotionsSidebar")}
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
                      {formatDiscount(p, numberLocale)}
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
        <div className="sticky top-0 z-10 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 max-w-sm min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={t("pages.pos.cart.searchProductsPlaceholder")}
              title={t("pages.pos.cart.focusSearchHint")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Input
                placeholder={t("pages.pos.cart.orderCodePlaceholder")}
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
                  t("pages.pos.cart.openOrder")
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
            {t("pages.pos.cart.productCount", {
              count: filteredProducts.length,
            })}
          </Badge>
          {activePromotions.length > 0 && (
            <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40">
              <Tag className="h-3 w-3" />
              {t("pages.pos.cart.promoBadgeShort", {
                count: activePromotions.length,
              })}
            </Badge>
          )}
        </div>

        {(selectedTableName || displayOrderCode || selectedCustomer) && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 shrink-0">
            {selectedTableName && (
              <Badge variant="outline" className="text-[10px] font-medium">
                {t("pages.pos.cart.checkoutTableLine")} {selectedTableName}
              </Badge>
            )}
            {displayOrderCode && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {displayOrderCode}
              </Badge>
            )}
            {selectedCustomer && (
              <Badge variant="outline" className="text-[10px] gap-1 max-w-[12rem] truncate">
                <UserRound className="h-3 w-3 shrink-0" />
                {selectedCustomer.name}
              </Badge>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
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
                <p className="text-sm font-medium">{t("pages.pos.cart.noProductsFound")}</p>
                <p className="text-xs mt-1 text-muted-foreground/80">{t("pages.pos.cart.noProductsFoundHint")}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3 pb-24 lg:pb-3">
              {filteredProducts.map((product) => {
                const inCartQty = cart
                  .filter((c) => c.productId === product.productId)
                  .reduce((s, c) => s + c.quantity, 0);
                return (
                  <PosProductCard
                    key={product.id}
                    product={product}
                    inCartQty={inCartQty}
                    promoMap={promoMap}
                    onSelect={handleProductClick}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Mobile: Floating cart */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
          {totalItems > 0 && (
            <div className="rounded-xl border bg-card/95 backdrop-blur px-3 py-1.5 shadow-md text-right">
              <p className="text-[10px] text-muted-foreground">
                {t("pages.pos.cart.subtotal")}
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {subtotal.toLocaleString(numberLocale)} ₫
              </p>
            </div>
          )}
          <Button
            size="lg"
            className={cn(
              "relative h-14 min-w-14 rounded-2xl shadow-lg px-4 gap-2",
              totalItems > 0 && "bg-emerald-600 hover:bg-emerald-700",
            )}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 ? (
              <span className="text-sm font-bold tabular-nums">{totalItems}</span>
            ) : null}
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
            title={
              cartAsideWide
                ? t("pages.pos.cart.narrowCartTitle")
                : t("pages.pos.cart.wideCartTitle")
            }
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
              {t("pages.pos.cart.mobileSheetTitle")}
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
              {t("pages.pos.cart.holdSuccessTitle")}
            </DialogTitle>
            <DialogDescription>
              {holdSuccessMessage || t("pages.pos.cart.holdSuccessDefault")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHoldSuccessOpen(false)}
            >
              {t("pages.pos.cart.continueSelling")}
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
              {t("pages.pos.cart.newOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move table dialog (explicit action) */}
      <Dialog open={moveTableOpen} onOpenChange={setMoveTableOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("pages.pos.cart.moveTableTitle")}</DialogTitle>
            <DialogDescription>
              {t("pages.pos.cart.moveTableDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">{t("pages.pos.cart.destTableLabel")}</Label>
            <Select value={moveToTableId} onValueChange={setMoveToTableId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("pages.pos.cart.selectTable")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("pages.pos.cart.selectTable")}</SelectItem>
                {tables
                  .filter(
                    (tbl) =>
                      tbl.status === "AVAILABLE" && tbl.id !== selectedTableId,
                  )
                  .map((tbl) => (
                    <SelectItem key={tbl.id} value={tbl.id}>
                      {tbl.name}{" "}
                      {tbl.capacity
                        ? t("pages.pos.cart.capacitySeats", {
                            count: tbl.capacity,
                          })
                        : ""}
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
              {t("pages.pos.cart.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMoveTable}
              disabled={!moveToTableId || moveToTableId === "none"}
            >
              {t("pages.pos.cart.confirm")}
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
              {t("pages.pos.cart.checkoutConfirmTitle")}
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
                          numberLocale,
                        )}
                        ₫
                      </span>
                    )}
                    <span className="font-medium tabular-nums">
                      {(item.price * item.quantity).toLocaleString(numberLocale)} ₫
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between items-center px-1 text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />{" "}
                  {t("pages.pos.cart.checkoutTotalSavings")}
                </span>
                <span className="text-emerald-600 font-semibold tabular-nums">
                  -{totalSavings.toLocaleString(numberLocale)} ₫
                </span>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <span className="text-sm text-muted-foreground">
                {t("pages.pos.cart.subtotal")}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {subtotal.toLocaleString(numberLocale)} ₫
              </span>
            </div>

            {pointsToRedeem > 0 && (
              <div className="flex justify-between items-center px-1 text-sm">
                <span className="text-muted-foreground">
                  {t("pages.pos.cart.pointsDiscount")}
                </span>
                <span className="text-emerald-600 font-semibold tabular-nums">
                  -{(pointsToRedeem * 1000).toLocaleString(numberLocale)} ₫
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
                  <span className="font-semibold">
                    {t("pages.pos.cart.checkoutGrandTotal")}
                  </span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {totalAfterPoints.toLocaleString(numberLocale)} ₫
                  </span>
                </div>
              )}
            </div>

            {selectedTableId && selectedTableId !== "none" && (
              <div className="text-sm text-muted-foreground px-1">
                {t("pages.pos.cart.checkoutTableLine")}{" "}
                {tables.find((tbl) => tbl.id === selectedTableId)?.name ||
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
                      numberLocale,
                    )}{" "}
                    {t("pages.pos.receipt.pointsSuffix")}
                  </span>
                </div>
                {(selectedCustomer.loyaltyPoints ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Coins className="h-3 w-3" />{" "}
                        {t("pages.pos.cart.checkoutPointsHint")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NumericInput
                        formatted={false}
                        max={selectedCustomer.loyaltyPoints}
                        value={
                          pointsToRedeem ? String(pointsToRedeem) : ""
                        }
                        onChange={(raw) => {
                          const v = Math.max(
                            0,
                            Math.min(
                              selectedCustomer.loyaltyPoints,
                              parseInt(raw, 10) || 0,
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
                        {t("pages.pos.cart.checkoutUseAllPoints")}
                      </Button>
                      {pointsToRedeem > 0 && (
                        <span className="text-xs text-emerald-600 font-medium shrink-0">
                          -{(pointsToRedeem * 1000).toLocaleString(numberLocale)}₫
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t("pages.pos.cart.checkoutPaymentMethods")}
              </p>
              {paymentMethod === "ShipCOD" && (
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  <Trans
                    i18nKey="pages.pos.cart.shipCodHint"
                    components={{ b: <span className="font-medium" /> }}
                  />
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paymentMethods.map((pm) => {
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
                  {t("pages.pos.cart.transferProofHint")}
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
                        : t("pages.pos.cart.pickProofImage")}
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
                      {t("pages.pos.cart.removeProofImage")}
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
              {t("pages.pos.cart.previewInvoice")}
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={submitting}
            >
              {t("pages.pos.cart.checkoutCancel")}
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={submitting || shopPosWriteBlocked}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("pages.pos.cart.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice preview (draft) */}
      <Dialog open={invoicePreviewOpen} onOpenChange={setInvoicePreviewOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("pages.pos.cart.invoicePreviewTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.pos.cart.invoicePreviewDraftDesc")}
            </DialogDescription>
          </DialogHeader>
          {taxPreviewLoading && totalAfterPoints > 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-500 px-6 pb-1 shrink-0">
              {t("pages.pos.cart.invoicePreviewTaxUpdating")}
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
              {t("pages.pos.cart.close")}
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
              {t("pages.pos.cart.printPreview")}
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
              {t("pages.pos.cart.invoiceAfterPaymentTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.pos.cart.invoiceAfterPaymentDesc")}
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
              {t("pages.pos.cart.close")}
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
              {t("pages.pos.cart.printInvoice")}
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
              {t("pages.pos.cart.postSaleTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.pos.cart.postSaleDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("pages.pos.cart.guestNameRequiredLabel")}</Label>
              <Input
                className="h-9"
                value={postSaleName}
                onChange={(e) => setPostSaleName(e.target.value)}
                placeholder={t("pages.pos.cart.guestFullNamePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("pages.pos.cart.phoneOptionalLabel")}</Label>
              <Input
                className="h-9"
                value={postSalePhone}
                onChange={(e) => setPostSalePhone(e.target.value)}
                placeholder={t("pages.pos.cart.optionalPlaceholder")}
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
              {t("pages.pos.cart.skip")}
            </Button>
            <Button
              type="button"
              onClick={handlePostSaleCustomerSave}
              disabled={postSaleSaving}
            >
              {postSaleSaving && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("pages.pos.cart.createCustomerAttach")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ghép bàn (TableGroup) */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pages.pos.cart.mergeTablesTitle")}</DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="pages.pos.cart.mergeTablesDesc"
                components={{ b: <span className="font-medium" /> }}
              />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-2 max-h-64 overflow-y-auto">
              {tables.map((tbl) => {
                const checked = groupSelectedIds.includes(tbl.id);
                return (
                  <label
                    key={tbl.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer"
                  >
                    <span className="truncate">
                      {tbl.name}{" "}
                      {tbl.capacity
                        ? t("pages.pos.cart.capacitySeats", {
                            count: tbl.capacity,
                          })
                        : ""}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setGroupSelectedIds((prev) =>
                          on
                            ? [...prev, tbl.id]
                            : prev.filter((x) => x !== tbl.id),
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>

            {tableGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("pages.pos.cart.existingGroups")}
                </p>
                <div className="space-y-2">
                  {tableGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {g.name ||
                            t("pages.pos.cart.groupNameShort", {
                              id: g.id?.slice?.(-6) || "",
                            })}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(g.tableIds || [])
                            .map(
                              (id) =>
                                tables.find((tbl) => tbl.id === id)?.name || id,
                            )
                            .join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUngroup(g.id)}
                      >
                        {t("pages.pos.cart.ungroup")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              {t("pages.pos.cart.close")}
            </Button>
            <Button onClick={handleCreateGroup}>{t("pages.pos.cart.createGroup")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tách món sang đơn mới */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pages.pos.cart.splitTitle")}</DialogTitle>
            <DialogDescription>
              {t("pages.pos.cart.splitDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">{t("pages.pos.cart.splitDestTableLabel")}</Label>
              <Select value={splitToTableId} onValueChange={setSplitToTableId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("pages.pos.cart.selectTable")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("pages.pos.cart.noTable")}</SelectItem>
                  {tables
                    .filter((tbl) => tbl.id !== selectedTableId)
                    .map((tbl) => (
                      <SelectItem key={tbl.id} value={tbl.id}>
                        {tbl.name}
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
                        {t("pages.pos.cart.splitMax", { max })}
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
              {t("pages.pos.cart.close")}
            </Button>
            <Button onClick={handleSplit}>{t("pages.pos.cart.splitAction")}</Button>
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
            <DialogTitle>{t("pages.pos.cart.pickVariantTitle")}</DialogTitle>
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
                  : `${t("pages.pos.cart.stockColon")} ${(bv.quantity ?? 0).toLocaleString(numberLocale)}`;
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
                    {price.toLocaleString(numberLocale)}₫
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
              {t("pages.pos.cart.cancel")}
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
            <DialogTitle>{t("pages.pos.cart.pickToppingTitle")}</DialogTitle>
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
    </div>
  );
}