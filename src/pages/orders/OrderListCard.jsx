import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Globe, MoreHorizontal, Pin, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  displayOrderCode,
  OrderStatusBadge,
  PaymentCollectionBadge,
  orderCustomerLabel,
  orderItemQty,
  orderStatusCardAccent,
  orderTotalAmount,
} from "./orderListUi.jsx";
import { ORDER_CARD_TORN_CLIP_PATH } from "./orderCardTornClip.js";

export function OrderListCard({
  order,
  numberLocale,
  tableName,
  branchName,
  showBranch,
  showTable,
  onOpen,
  actionsMenu,
  pinned = false,
  onTogglePin,
  className,
}) {
  const { t } = useTranslation();
  const source = (order?.orderSource || "").toUpperCase();
  const isOnline = source === "ONLINE";
  const isInStore = source === "IN_STORE";
  const items = order.items ?? [];
  const customer = orderCustomerLabel(order, t);
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const total = orderTotalAmount(order);
  const qty = orderItemQty(order);
  const showBranchOnCard = showBranch && branchName && !isOnline;
  const accent = orderStatusCardAccent(order.status);
  const mutedCard = order.status === "CANCELLED";
  const tornClipId = useId();

  return (
    <div
      className={cn(
        "group/order-receipt relative flex w-full cursor-pointer flex-col pt-1.5 transition-[filter] hover:drop-shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
        accent.shell,
        mutedCard && "opacity-98",
        pinned &&
          "ring-2 ring-amber-400/35 ring-offset-2 ring-offset-background dark:ring-amber-500/40",
        className,
      )}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {onTogglePin ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-1/2 top-0 z-20 h-7 w-7 -translate-x-1/2 rounded-full border bg-background/95 shadow-sm backdrop-blur-sm transition-colors hover:bg-background",
            pinned
              ? "border-amber-300 text-amber-600 dark:border-amber-500/55 dark:text-amber-400"
              : "border-border/70 text-muted-foreground/75 hover:text-foreground",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          title={
            pinned
              ? t("pages.orders.list.unpinOrder")
              : t("pages.orders.list.pinOrder")
          }
          aria-pressed={pinned}
          aria-label={
            pinned
              ? t("pages.orders.list.unpinOrder")
              : t("pages.orders.list.pinOrder")
          }
        >
          <Pin
            className={cn("h-3.5 w-3.5", pinned && "rotate-45 fill-current")}
            aria-hidden
          />
        </Button>
      ) : null}
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-xl"
        style={{
          clipPath: `url(#${tornClipId})`,
          WebkitClipPath: `url(#${tornClipId})`,
        }}
      >
      <Card className="flex w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent py-0 shadow-none">
        <CardHeader
          className={cn(
            "flex shrink-0 flex-row items-start justify-between gap-2 space-y-0 px-4 py-3",
            accent.header,
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                {displayOrderCode(order)}
              </span>
              {isOnline ? (
                <Badge
                  className="h-5 gap-0.5 px-1.5 py-0 text-[10px] bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200"
                  title={t("pages.orders.list.onlineBadgeTitle")}
                >
                  <Globe className="h-2.5 w-2.5" />
                  {t("pages.orders.list.onlineBadge")}
                </Badge>
              ) : null}
              {isInStore ? (
                <Badge
                  className="h-5 gap-0.5 px-1.5 py-0 text-[10px] bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200"
                  title={t("pages.orders.list.inStoreBadgeTitle")}
                >
                  {t("pages.orders.list.inStoreBadge")}
                </Badge>
              ) : null}
            </div>
            {created ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {created.toLocaleDateString(numberLocale)}{" "}
                {created.toLocaleTimeString(numberLocale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">{t("pages.orders.list.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              {actionsMenu}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className={cn("flex flex-col gap-2.5 px-4 py-3", accent.body)}>
          {showBranchOnCard || (showTable && tableName) ? (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {showBranchOnCard ? (
                <span
                  className={cn(
                    "rounded-md bg-muted/50 px-2 py-0.5 font-medium text-foreground/90 dark:bg-white/14 dark:text-foreground",
                  )}
                >
                  {branchName}
                </span>
              ) : null}
              {showTable && tableName ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 font-medium text-foreground/90 dark:bg-white/14 dark:text-foreground">
                  <UtensilsCrossed className="h-3 w-3 shrink-0" />
                  {tableName}
                </span>
              ) : null}
            </div>
          ) : null}

          {customer ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={customer.primary}>
                {customer.primary}
              </p>
              {customer.secondary ? (
                <p
                  className="truncate text-xs text-muted-foreground"
                  title={customer.secondary}
                >
                  {customer.secondary}
                </p>
              ) : null}
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className={cn("rounded-md px-2.5 py-2", accent.inner)}>
              <p className="truncate text-sm font-semibold text-foreground">
                {items[0].productName}
              </p>
              {items.length > 1 ? (
                <p className="text-xs text-muted-foreground">
                  {t("pages.orders.list.moreProducts", { count: items.length - 1 })}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("pages.orders.list.cardNoItems")}
            </p>
          )}
        </CardContent>

      </Card>

      <div className={cn("mt-auto shrink-0 pb-3", accent.footer)}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentCollectionBadge
              paid={order.paid}
              paymentStatus={order.paymentStatus}
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("pages.orders.list.colQty")}: {qty}
            </p>
            <p className="text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
              {total.toLocaleString(numberLocale)} ₫
            </p>
          </div>
        </div>
      </div>
      </div>

      <svg
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        focusable="false"
      >
        <defs>
          <clipPath id={tornClipId} clipPathUnits="objectBoundingBox">
            <path d={ORDER_CARD_TORN_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

export function OrderListCardSkeleton() {
  const tornClipId = useId();
  return (
    <div className="relative flex w-full flex-col drop-shadow-sm dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div
        className="flex flex-col overflow-hidden rounded-t-xl"
        style={{
          clipPath: `url(#${tornClipId})`,
          WebkitClipPath: `url(#${tornClipId})`,
        }}
      >
        <Card className="flex flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent py-0 shadow-none">
          <div className="h-16 shrink-0 animate-pulse bg-muted/40 dark:bg-muted/55" />
          <div className="flex flex-col gap-2 bg-muted/40 p-4 dark:bg-muted/30">
            <div className="space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 animate-pulse rounded bg-muted/60" />
          </div>
        </Card>
        <div className="shrink-0 animate-pulse bg-muted/40 pb-3 dark:bg-muted/50">
          <div className="h-14" />
        </div>
      </div>
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <defs>
          <clipPath id={tornClipId} clipPathUnits="objectBoundingBox">
            <path d={ORDER_CARD_TORN_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
