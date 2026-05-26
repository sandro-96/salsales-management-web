import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Monitor,
  Receipt,
  ShoppingCart,
  Store,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { posNumberLocale } from "@/utils/posHelpers";
import { usePosCustomerDisplaySnapshot } from "./posDisplayBridge.js";

function DisplayEmptyState({ icon: Icon, title, hint, themeClasses }) {
  return (
    <div
      className={cn(
        "flex min-h-[340px] flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center",
        themeClasses.emptyState,
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          themeClasses.emptyStateIcon,
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h2 className={cn("text-xl font-semibold", themeClasses.primaryText)}>
        {title}
      </h2>
      <p
        className={cn(
          "mt-2 max-w-md text-sm leading-6",
          themeClasses.mutedText,
        )}
      >
        {hint}
      </p>
    </div>
  );
}

export default function PosCustomerDisplayPage() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const displayId = searchParams.get("displayId") || "";
  const themeMode = searchParams.get("theme") === "light" ? "light" : "dark";
  const isLightTheme = themeMode === "light";
  const snapshot = usePosCustomerDisplaySnapshot(displayId);
  const themeClasses = useMemo(
    () =>
      isLightTheme
        ? {
            page: "bg-slate-100 text-slate-900",
            header: "border-b border-slate-200 bg-white/90 backdrop-blur",
            panel: "border-slate-200 bg-white",
            card: "border-slate-200 bg-white text-slate-900 shadow-sm",
            liveBadge:
              "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
            outlineBadge:
              "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50",
            emptyState: "border-slate-200 bg-white text-slate-600 shadow-sm",
            emptyStateIcon: "bg-slate-100 text-slate-600",
            primaryText: "text-slate-900",
            secondaryText: "text-slate-700",
            mutedText: "text-slate-500",
            subtleText: "text-slate-400",
            accentSurface: "bg-slate-100",
            itemRow: "border-slate-200 bg-slate-50",
            noteBox: "border-slate-200 bg-slate-50",
            strongValue: "text-slate-900",
            strikethrough: "text-slate-400",
            totalAccent: "text-emerald-600",
            qrFrame: "bg-white p-4 shadow-lg ring-1 ring-slate-200",
          }
        : {
            page: "bg-slate-950 text-slate-50",
            header: "border-b border-white/10 bg-white/5 backdrop-blur",
            panel: "border-white/10 bg-white/5",
            card: "border-white/10 bg-white/5 text-slate-50 shadow-none",
            liveBadge:
              "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15",
            outlineBadge:
              "border-white/15 bg-white/5 text-slate-100 hover:bg-white/5",
            emptyState: "border-white/10 bg-white/5 text-slate-300",
            emptyStateIcon: "bg-white/10 text-slate-200",
            primaryText: "text-white",
            secondaryText: "text-slate-300",
            mutedText: "text-slate-400",
            subtleText: "text-slate-500",
            accentSurface: "bg-white/10",
            itemRow: "border-white/10 bg-slate-900/70",
            noteBox: "border-white/10 bg-slate-900/60",
            strongValue: "text-white",
            strikethrough: "text-slate-500",
            totalAccent: "text-emerald-300",
            qrFrame: "bg-white p-4 shadow-lg",
          },
    [isLightTheme],
  );

  const updatedAtLabel = useMemo(() => {
    if (!snapshot?.updatedAt) return null;
    try {
      return new Date(snapshot.updatedAt).toLocaleTimeString(
        i18n.language === "vi" ? "vi-VN" : "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        },
      );
    } catch {
      return null;
    }
  }, [snapshot?.updatedAt, i18n.language]);

  const formatMoney = (value) =>
    Number(value ?? 0).toLocaleString(numberLocale, {
      maximumFractionDigits: 0,
    });
  const hasPaymentInfo = Boolean(
    snapshot?.paymentBankName ||
      snapshot?.paymentAccountNumber ||
      snapshot?.paymentAccountHolder ||
      snapshot?.paymentTransferNote,
  );

  if (!displayId) {
    return (
      <div className={cn("min-h-screen px-4 py-8 sm:px-6", themeClasses.page)}>
        <DisplayEmptyState
          icon={Monitor}
          title={t("pages.pos.customerDisplay.missingLinkTitle")}
          hint={t("pages.pos.customerDisplay.missingLinkHint")}
          themeClasses={themeClasses}
        />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", themeClasses.page)}>
      <header className={themeClasses.header}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={themeClasses.liveBadge}>
                {t("pages.pos.customerDisplay.liveBadge")}
              </Badge>
              {updatedAtLabel ? (
                <span className={cn("text-xs", themeClasses.mutedText)}>
                  {t("pages.pos.customerDisplay.updatedAt", {
                    time: updatedAtLabel,
                  })}
                </span>
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("pages.pos.customerDisplay.title")}
              </h1>
              <p className={cn("mt-1 text-sm", themeClasses.secondaryText)}>
                {t("pages.pos.customerDisplay.subtitle")}
              </p>
            </div>
          </div>

          {snapshot ? (
            <div className="flex flex-wrap items-center gap-2">
              {snapshot.shopName ? (
                <Badge
                  variant="outline"
                  className={themeClasses.outlineBadge}
                >
                  <Store className="mr-1.5 h-3.5 w-3.5" />
                  {snapshot.shopName}
                  {snapshot.branchName ? ` · ${snapshot.branchName}` : ""}
                </Badge>
              ) : null}
              {snapshot.tableName ? (
                <Badge
                  variant="outline"
                  className={themeClasses.outlineBadge}
                >
                  {t("pages.pos.receipt.tableLabel")}: {snapshot.tableName}
                </Badge>
              ) : null}
              {snapshot.orderCode ? (
                <Badge
                  variant="outline"
                  className={cn("font-mono", themeClasses.outlineBadge)}
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" />
                  {snapshot.orderCode}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.95fr)]">
        <section
          className={cn(
            "min-h-0 rounded-3xl border p-4 sm:p-5",
            themeClasses.panel,
          )}
        >
          {snapshot ? (
            snapshot.items.length > 0 ? (
              <>
                <div
                  className={cn(
                    "mb-4 flex items-center justify-between gap-3 border-b pb-4",
                    isLightTheme ? "border-slate-200" : "border-white/10",
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        "text-xs uppercase tracking-[0.24em]",
                        themeClasses.mutedText,
                      )}
                    >
                      {t("pages.pos.customerDisplay.itemsTitle")}
                    </p>
                    <p className={cn("mt-1 text-sm", themeClasses.secondaryText)}>
                      {t("pages.pos.customerDisplay.itemLines", {
                        count: snapshot.itemCount,
                      })}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-right",
                      themeClasses.accentSurface,
                    )}
                  >
                    <p className={cn("text-xs", themeClasses.mutedText)}>
                      {t("pages.pos.cart.subtotal")}
                    </p>
                    <p className={cn("text-lg font-semibold", themeClasses.primaryText)}>
                      {formatMoney(snapshot.subtotal)} ₫
                    </p>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-18rem)] min-h-[360px] pr-2">
                  <div className="space-y-3">
                    {snapshot.items.map((item, index) => (
                      <div
                        key={item.lineKey || `${item.productName}-${index}`}
                        className={cn(
                          "flex items-start justify-between gap-4 rounded-2xl border px-4 py-4",
                          themeClasses.itemRow,
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-lg font-medium sm:text-xl",
                              themeClasses.primaryText,
                            )}
                          >
                            {item.productName}
                          </p>
                          <div
                            className={cn(
                              "mt-2 flex flex-wrap items-center gap-2 text-sm",
                              themeClasses.secondaryText,
                            )}
                          >
                            <Badge
                              className={cn(
                                "hover:bg-transparent",
                                themeClasses.accentSurface,
                                isLightTheme ? "text-slate-700" : "text-slate-100",
                              )}
                            >
                              {item.quantityLabel}
                            </Badge>
                            {item.hasDiscount && item.promoLabel ? (
                              <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">
                                {item.promoLabel}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {item.hasDiscount ? (
                            <p
                              className={cn(
                                "text-sm line-through",
                                themeClasses.strikethrough,
                              )}
                            >
                              {formatMoney(
                                item.originalUnitPrice * item.quantityValue,
                              )}{" "}
                              ₫
                            </p>
                          ) : null}
                          <p
                            className={cn(
                              "text-xl font-semibold sm:text-2xl",
                              themeClasses.primaryText,
                            )}
                          >
                            {formatMoney(item.lineTotal)} ₫
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <DisplayEmptyState
                icon={ShoppingCart}
                title={t("pages.pos.customerDisplay.emptyTitle")}
                hint={t("pages.pos.customerDisplay.emptyHint")}
                themeClasses={themeClasses}
              />
            )
          ) : (
            <DisplayEmptyState
              icon={Monitor}
              title={t("pages.pos.customerDisplay.waitingTitle")}
              hint={t("pages.pos.customerDisplay.waitingHint")}
              themeClasses={themeClasses}
            />
          )}
        </section>

        <aside className="space-y-4">
          <Card className={themeClasses.card}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("pages.pos.customerDisplay.summaryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div
                className={cn(
                  "flex items-center justify-between gap-3",
                  themeClasses.secondaryText,
                )}
              >
                <span>{t("pages.pos.cart.subtotal")}</span>
                <span className={cn("font-medium", themeClasses.strongValue)}>
                  {formatMoney(snapshot?.subtotal)} ₫
                </span>
              </div>
              {snapshot?.totalSavings > 0 ? (
                <div className="flex items-center justify-between gap-3 text-emerald-300">
                  <span>{t("pages.pos.cart.savings")}</span>
                  <span className="font-medium">
                    -{formatMoney(snapshot.totalSavings)} ₫
                  </span>
                </div>
              ) : null}
              {snapshot?.pointsDiscount > 0 ? (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3",
                    themeClasses.secondaryText,
                  )}
                >
                  <span>{t("pages.pos.cart.pointsDiscount")}</span>
                  <span className={cn("font-medium", themeClasses.strongValue)}>
                    -{formatMoney(snapshot.pointsDiscount)} ₫
                  </span>
                </div>
              ) : null}
              <div
                className={cn(
                  "border-t pt-3",
                  isLightTheme ? "border-slate-200" : "border-white/10",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn("text-base font-medium", themeClasses.strongValue)}
                  >
                    {t("pages.pos.cart.checkoutGrandTotal")}
                  </span>
                  <span className={cn("text-3xl font-semibold", themeClasses.totalAccent)}>
                    {formatMoney(snapshot?.grandTotal)} ₫
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={themeClasses.card}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("pages.pos.cart.sectionCustomer")}
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn("space-y-3 text-sm", themeClasses.secondaryText)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-full p-2",
                    themeClasses.accentSurface,
                  )}
                >
                  <UserRound
                    className={cn(
                      "h-4 w-4",
                      isLightTheme ? "text-slate-700" : "text-slate-100",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn("text-base font-medium", themeClasses.strongValue)}
                  >
                    {snapshot?.customerName ||
                      t("pages.pos.customerDisplay.customerFallback")}
                  </p>
                  {snapshot?.customerPhone ? (
                    <p className={cn("mt-1 text-sm", themeClasses.mutedText)}>
                      {snapshot.customerPhone}
                    </p>
                  ) : null}
                </div>
              </div>

              {snapshot?.note ? (
                <div
                  className={cn(
                    "rounded-2xl border p-3",
                    themeClasses.noteBox,
                  )}
                >
                  <p
                    className={cn(
                      "text-xs uppercase tracking-[0.22em]",
                      themeClasses.mutedText,
                    )}
                  >
                    {t("pages.pos.receipt.noteLabel")}
                  </p>
                  <p className={cn("mt-2 text-sm leading-6", themeClasses.primaryText)}>
                    {snapshot.note}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {hasPaymentInfo ? (
            <Card className={themeClasses.card}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("pages.pos.customerDisplay.transferTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn("space-y-3 text-sm", themeClasses.secondaryText)}
              >
                {snapshot?.paymentBankName ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className={themeClasses.mutedText}>
                      {t("pages.tables.qr.printTransfer")}
                    </span>
                    <span
                      className={cn("text-right font-medium", themeClasses.strongValue)}
                    >
                      {snapshot.paymentBankName}
                    </span>
                  </div>
                ) : null}
                {snapshot?.paymentAccountNumber ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className={themeClasses.mutedText}>
                      {t("pages.tables.qr.printAccountNumber")}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-right font-semibold",
                        themeClasses.strongValue,
                      )}
                    >
                      {snapshot.paymentAccountNumber}
                    </span>
                  </div>
                ) : null}
                {snapshot?.paymentAccountHolder ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className={themeClasses.mutedText}>
                      {t("pages.tables.qr.printAccountHolder")}
                    </span>
                    <span
                      className={cn("text-right font-medium", themeClasses.strongValue)}
                    >
                      {snapshot.paymentAccountHolder}
                    </span>
                  </div>
                ) : null}
                {snapshot?.paymentTransferNote ? (
                  <div
                    className={cn(
                      "rounded-2xl border p-3",
                      themeClasses.noteBox,
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs uppercase tracking-[0.22em]",
                        themeClasses.mutedText,
                      )}
                    >
                      {t("pages.tables.qr.printTransferNote")}
                    </p>
                    <p className={cn("mt-2 text-sm leading-6", themeClasses.primaryText)}>
                      {snapshot.paymentTransferNote}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {snapshot?.paymentQrImageUrl ? (
            <Card className={themeClasses.card}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("pages.pos.customerDisplay.qrTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn("space-y-4 text-sm", themeClasses.secondaryText)}
              >
                <div
                  className={cn(
                    "mx-auto flex w-fit justify-center rounded-3xl",
                    themeClasses.qrFrame,
                  )}
                >
                  <img
                    src={snapshot.paymentQrImageUrl}
                    alt={t("pages.pos.customerDisplay.qrImageAlt")}
                    className="max-h-[220px] rounded-2xl object-contain"
                  />
                </div>
                <p
                  className={cn(
                    "text-center text-sm leading-6",
                    themeClasses.secondaryText,
                  )}
                >
                  {t("pages.pos.customerDisplay.qrHint")}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
