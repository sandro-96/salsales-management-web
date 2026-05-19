import React, { useState } from "react";
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
  Loader2,
  UserRound,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PosTaxBreakdown } from "./PosTaxBreakdown";
import { posNumberLocale } from "../../utils/posHelpers";

export function CartPanel({
  cart,
  totalItems,
  subtotal,
  totalSavings,
  note,
  setNote,
  guestName,
  guestPhone,
  setGuestName,
  setGuestPhone,
  selectedTableId,
  setSelectedTableId,
  availableTables,
  updateQuantity,
  updateWeight,
  removeFromCart,
  clearCart,
  onCheckout,
  checkoutDisabled,
  checkoutDisabledHint,
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
  holdDisabled,
  canMoveTable,
  onOpenMoveTableDialog,
  onOpenGroupDialog,
  onOpenSplitDialog,
  splitDisabled,
  onMergeGroupBills,
  mergeGroupDisabled,
  mergeGroupBusy,
  activeGroup,
  tables,
  onQuickSwitchTable,
  canPay = true,
}) {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);
  const [tableOpsOpen, setTableOpsOpen] = useState(false);
  const hasGuestInfo = Boolean((guestName ?? "").trim() || (guestPhone ?? "").trim());
  const [customerOpen, setCustomerOpen] = useState(
    Boolean(selectedCustomer) || hasGuestInfo,
  );

  return (
  <>
    {!hideHeader && (
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-semibold text-sm">{t("pages.pos.cart.title")}</span>
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
            {t("pages.pos.cart.clearAll")}
          </Button>
        )}
      </div>
    )}

    <div className="p-3 border-b space-y-2">
      {/* Customer: compact summary row; full form hidden unless expanded */}
      {selectedCustomer ? (
        <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2.5 py-1.5">
          <UserRound className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">
              {selectedCustomer.name}
            </span>
            {selectedCustomer.phone && (
              <span className="text-[10px] text-muted-foreground truncate">
                · {selectedCustomer.phone}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 font-medium shrink-0">
              <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
              {(selectedCustomer.loyaltyPoints ?? 0).toLocaleString(numberLocale)}
            </span>
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
      ) : hasGuestInfo && !customerOpen ? (
        <button
          type="button"
          onClick={() => setCustomerOpen(true)}
          className="w-full flex items-center gap-2 bg-muted/40 hover:bg-muted/60 transition-colors rounded-md px-2.5 py-1.5 text-left"
        >
          <UserRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="flex-1 min-w-0 text-xs font-medium truncate">
            {(guestName ?? "").trim() || t("pages.pos.cart.guestRecorded")}
            {(guestPhone ?? "").trim() ? (
              <span className="text-muted-foreground font-normal">
                {" "}· {guestPhone}
              </span>
            ) : null}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      ) : !customerOpen ? (
        <button
          type="button"
          onClick={() => setCustomerOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-md px-2.5 py-1.5 border border-dashed border-muted-foreground/30"
        >
          <UserRound className="h-3.5 w-3.5" />
          <span>{t("pages.pos.cart.addGuestInfo")}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("pages.pos.cart.guestInfo")}
            </span>
            <button
              type="button"
              onClick={() => setCustomerOpen(false)}
              className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {t("pages.pos.cart.collapse")}
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("pages.pos.cart.searchCustomerPlaceholder")}
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
                      {(c.loyaltyPoints ?? 0).toLocaleString(numberLocale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 rounded-md border border-dashed border-muted-foreground/25 px-2.5 py-2 bg-muted/20">
            <p className="text-[10px] text-muted-foreground leading-tight">
              {t("pages.pos.cart.guestNoteHint")}
            </p>
            <Input
              placeholder={t("pages.pos.cart.guestNamePlaceholder")}
              className="h-8 text-xs"
              value={guestName ?? ""}
              onChange={(e) => setGuestName(e.target.value)}
            />
            <Input
              placeholder={t("pages.pos.cart.guestPhonePlaceholder")}
              className="h-8 text-xs"
              value={guestPhone ?? ""}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      {showTableSelect && (
        <div className="space-y-2">
          <Select
            value={selectedTableId || "none"}
            onValueChange={setSelectedTableId}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t("pages.pos.cart.selectTablePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">
                {t("pages.pos.cart.noTable")}
              </SelectItem>
              {availableTables.map((tbl) => (
                <SelectItem
                  key={tbl.id}
                  value={tbl.id}
                  disabled={tbl.status === "CLOSED"}
                  className={[
                    "text-xs rounded-sm my-0.5",
                    tbl.alwaysAvailable &&
                      tbl.status !== "CLOSED" &&
                      "bg-sky-50 text-sky-900 focus:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-100 dark:focus:bg-sky-500/25",
                    !tbl.alwaysAvailable &&
                      tbl.status === "AVAILABLE" &&
                      "bg-emerald-50 text-emerald-900 focus:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-100 dark:focus:bg-emerald-500/25",
                    !tbl.alwaysAvailable &&
                      tbl.status === "OCCUPIED" &&
                      "bg-amber-50 text-amber-950 focus:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-100 dark:focus:bg-amber-500/25",
                    tbl.status === "CLOSED" &&
                      "bg-slate-100 text-slate-500 line-through opacity-80 dark:bg-muted dark:text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span className="truncate">
                      {tbl.name}{" "}
                      {tbl.capacity
                        ? t("pages.pos.cart.capacitySeats", {
                            count: tbl.capacity,
                          })
                        : ""}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span
                        className={[
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          tbl.alwaysAvailable &&
                            tbl.status !== "CLOSED" &&
                            "bg-sky-100 text-sky-900 dark:bg-sky-500/25 dark:text-sky-100",
                          !tbl.alwaysAvailable &&
                            tbl.status === "AVAILABLE" &&
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-100",
                          !tbl.alwaysAvailable &&
                            tbl.status === "OCCUPIED" &&
                            "bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100",
                          tbl.status === "CLOSED" &&
                            "bg-slate-200 text-slate-700 dark:bg-muted dark:text-muted-foreground",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {tbl.status === "CLOSED"
                          ? t("pages.pos.cart.tableStatusClosed")
                          : tbl.alwaysAvailable
                            ? t("pages.pos.cart.tableStatusAlwaysAvailable")
                            : tbl.status === "AVAILABLE"
                              ? t("pages.pos.cart.tableStatusAvailable")
                              : t("pages.pos.cart.tableStatusOccupied")}
                      </span>
                      {activeGroup?.tableIds?.includes?.(tbl.id) ? (
                        <span className="text-[10px] text-muted-foreground">
                          {activeGroup.name
                            ? activeGroup.name
                            : t("pages.pos.cart.groupFallback")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canMoveTable && (
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs w-full"
              onClick={onOpenMoveTableDialog}
            >
              {t("pages.pos.cart.moveTable")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs w-full justify-between font-normal text-muted-foreground hover:text-foreground px-2"
            onClick={() => setTableOpsOpen((o) => !o)}
          >
            <span>{t("pages.pos.cart.tableOpsToggle")}</span>
            {tableOpsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </Button>
          {tableOpsOpen && (
            <div className="space-y-2 pt-0.5">
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
                        {tables.find((tbl) => tbl.id === id)?.name || id}
                      </Button>
                    ))}
                </div>
              )}
              {activeGroup?.tableIds?.length > 1 && (
                <p className="text-[10px] text-muted-foreground leading-snug">
                  <Trans
                    i18nKey="pages.pos.cart.mergeGroupHint"
                    components={{ b: <span className="font-medium" /> }}
                  />
                </p>
              )}
              {activeGroup?.tableIds?.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 text-xs w-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-800"
                  disabled={mergeGroupDisabled || mergeGroupBusy}
                  onClick={onMergeGroupBills}
                >
                  {mergeGroupBusy && (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  )}
                  {t("pages.pos.cart.mergeGroupBill")}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={onOpenGroupDialog}
                >
                  {t("pages.pos.cart.mergeTables")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={onOpenSplitDialog}
                  disabled={splitDisabled}
                >
                  {t("pages.pos.cart.splitItems")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    <ScrollArea className="flex-1">
      {cart.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">{t("pages.pos.cart.emptyCartTitle")}</p>
            <p className="text-[10px] mt-1">
              {t("pages.pos.cart.emptyCartHint")}
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
                        {item.originalPrice.toLocaleString(numberLocale)}₫
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {item.price.toLocaleString(numberLocale)}₫
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {item.price.toLocaleString(numberLocale)} ₫
                    </span>
                  )}
                </div>
                {item.sellByWeight ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        updateWeight?.(
                          item.lineKey,
                          Math.max(
                            0,
                            Math.round(((item.weight ?? 0) - 0.1) * 1000) / 1000,
                          ),
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <NumericInput
                      formatted={false}
                      decimalScale={3}
                      value={
                        item.weight == null || item.weight === 0
                          ? ""
                          : String(item.weight)
                      }
                      onChange={(raw) =>
                        updateWeight?.(item.lineKey, raw)
                      }
                      className="h-6 w-16 text-xs text-center tabular-nums px-1"
                    />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {item.weightUnit || ""}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        updateWeight?.(
                          item.lineKey,
                          Math.round(((item.weight ?? 0) + 0.1) * 1000) / 1000,
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
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
                )}
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
                  {(
                    item.price *
                    (item.sellByWeight
                      ? Number(item.weight ?? 0)
                      : item.quantity)
                  ).toLocaleString(numberLocale)}{" "}
                  ₫
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>

    <div className="p-3 border-t">
      <Textarea
        placeholder={t("pages.pos.cart.orderNotePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-xs min-h-[56px] resize-none"
        rows={2}
      />
    </div>

    <div className="p-3 border-t space-y-2 bg-muted/20 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.25)]">
      {totalSavings > 0 && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-600 flex items-center gap-1">
            <Tag className="h-3 w-3" /> {t("pages.pos.cart.savings")}
          </span>
          <span className="text-emerald-600 font-semibold tabular-nums">
            -{totalSavings.toLocaleString(numberLocale)} ₫
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{t("pages.pos.cart.subtotal")}</span>
        <span
          className={`tabular-nums font-semibold ${
            taxPreview || taxPreviewLoading ? "text-sm" : "text-lg font-bold"
          }`}
        >
          {subtotal.toLocaleString(numberLocale)} ₫
        </span>
      </div>
      {pointsToRedeem > 0 && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t("pages.pos.cart.pointsDiscount")}</span>
          <span className="text-emerald-600 font-medium tabular-nums">
            -{(pointsToRedeem * 1000).toLocaleString(numberLocale)} ₫
          </span>
        </div>
      )}
      {cart.length > 0 && (
        <PosTaxBreakdown loading={taxPreviewLoading} taxPreview={taxPreview} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="h-10 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-200 disabled:text-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 dark:disabled:bg-amber-500/30 dark:disabled:text-amber-200"
          disabled={holdDisabled}
          onClick={onHoldOrder}
        >
          <Receipt className="h-4 w-4 mr-2" />
          {t("pages.pos.cart.holdSave")}
        </Button>
        {/* <Button
          variant="outline"
          className="h-10 text-xs font-semibold"
          disabled={sendKitchenDisabled}
          onClick={onSendKitchen}
        >
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Gửi bếp
        </Button> */}
      </div>
      {canPay ? (
        <>
          {checkoutDisabled && checkoutDisabledHint ? (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 text-center px-1 leading-snug">
              {checkoutDisabledHint}
            </p>
          ) : null}
          <Button
            className="w-full h-11 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-200 disabled:text-emerald-900 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:disabled:bg-emerald-500/30 dark:disabled:text-emerald-100"
            disabled={checkoutDisabled ?? cart.length === 0}
            onClick={onCheckout}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t("pages.pos.cart.checkoutWithCount", { count: totalItems })}
          </Button>
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground text-center px-2">
          <Trans
            i18nKey="pages.pos.cart.noPayPermission"
            components={{ b: <span className="font-medium" /> }}
          />
        </p>
      )}
    </div>
  </>
);
}
