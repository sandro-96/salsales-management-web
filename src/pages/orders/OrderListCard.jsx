import { useTranslation } from "react-i18next";
import { Globe, MoreHorizontal, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

export function OrderListCard({
  order,
  numberLocale,
  tableName,
  branchName,
  showBranch,
  showTable,
  onOpen,
  actionsMenu,
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

  return (
    <Card
      className={cn(
        "flex h-full min-h-[220px] w-full cursor-pointer flex-col gap-0 bg-card py-0 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mutedCard && "opacity-90",
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
      <CardHeader
        className={cn(
          "flex shrink-0 flex-row items-start justify-between gap-2 space-y-0 border-b px-4 py-3",
          accent.header,
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-semibold tracking-tight">
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

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 py-3">
        <div className="shrink-0 space-y-2.5">
        {showBranchOnCard || (showTable && tableName) ? (
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {showBranchOnCard ? (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 bg-background/50 dark:bg-background/30",
                )}
              >
                {branchName}
              </span>
            ) : null}
            {showTable && tableName ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-background/50 px-2 py-0.5 dark:bg-background/30">
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
        </div>

        <div className="flex min-h-[3.25rem] flex-1 flex-col justify-end">
          {items.length > 0 ? (
            <div className={cn("rounded-md border border-dashed px-2.5 py-2", accent.inner)}>
              <p className="truncate text-sm font-medium">{items[0].productName}</p>
              {items.length > 1 ? (
                <p className="text-xs text-muted-foreground">
                  {t("pages.orders.list.moreProducts", { count: items.length - 1 })}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("pages.orders.list.cardNoItems")}</p>
          )}
        </div>
      </CardContent>

      <CardFooter
        className={cn(
          "mt-auto flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5",
          accent.footer,
        )}
      >
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
          <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {total.toLocaleString(numberLocale)} ₫
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

export function OrderListCardSkeleton() {
  return (
    <Card className="flex h-full min-h-[220px] flex-col gap-0 overflow-hidden py-0">
      <div className="h-16 shrink-0 animate-pulse border-b bg-muted/40" />
      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="h-14 shrink-0 animate-pulse border-t bg-muted/30" />
    </Card>
  );
}
