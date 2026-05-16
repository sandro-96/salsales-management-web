import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useShop } from "../hooks/useShop";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { format, subDays, startOfMonth } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import {
  ShoppingCart,
  Crown,
  ArrowRight,
  Clock,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OverviewQuickActions } from "@/components/overview/OverviewQuickActions";
import { OverviewKpiCards } from "@/components/overview/OverviewKpiCards";
import {
  OverviewChartSkeleton,
  OverviewKpiSkeleton,
  OverviewListSkeleton,
} from "@/components/overview/OverviewPageSkeleton";

import {
  getReportSummary,
  getDailyReport,
  getTopProducts,
} from "../api/reportApi.js";
import { getOrders } from "../api/orderApi.js";

const ORDER_STATUS_CLS = {
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  CONFIRMED:
    "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  SHIPPING:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
};

const RANGE_KEYS = ["7", "14", "30", "month"];

const toISODate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildFormatters = (lang) => {
  const localeTag = lang?.startsWith("en") ? "en-US" : "vi-VN";
  return {
    currency: (value) =>
      Number(value || 0).toLocaleString(localeTag) +
      (lang?.startsWith("en") ? " VND" : "đ"),
    number: (value) => Number(value || 0).toLocaleString(localeTag),
  };
};

const OverviewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { selectedShop, selectedShopId, branches, isOwner, shopRole } =
    useShop();

  const { currency: formatCurrency, number: formatNumber } = useMemo(
    () => buildFormatters(i18n.language),
    [i18n.language],
  );
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const revenueLabel = t("overview.chartLegend.revenue");
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}:{" "}
            {p.name === revenueLabel
              ? formatCurrency(p.value)
              : formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const RANGE_OPTIONS = RANGE_KEYS.map((value) => ({
    value,
    label: t(`overview.ranges.${value}`),
  }));

  const [range, setRange] = useState("7");
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [reportError, setReportError] = useState(false);

  const canViewReport =
    isOwner || shopRole === "MANAGER";

  /** Đơn gần đây: 1 chi nhánh → luôn theo chi nhánh đó; nhiều chi nhánh → theo bộ lọc báo cáo. */
  const recentOrdersBranchId = useMemo(() => {
    if (branches?.length === 1) return branches[0]?.id;
    if (branchFilter !== "__all__") return branchFilter;
    return undefined;
  }, [branches, branchFilter]);

  const buildDateRange = useCallback(() => {
    const now = new Date();
    let startDate;
    if (range === "month") {
      startDate = startOfMonth(now);
    } else {
      startDate = subDays(now, parseInt(range, 10));
    }
    return { startDate: toISODate(startDate), endDate: toISODate(now) };
  }, [range]);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!selectedShopId) return;
    if (!silent) setLoading(true);
    setReportError(false);

    const { startDate, endDate } = buildDateRange();
    const reportBody = {
      startDate,
      endDate,
      branchId: branchFilter !== "__all__" ? branchFilter : null,
    };

    const promises = [];

    if (canViewReport) {
      promises.push(
        getReportSummary(selectedShopId, reportBody).catch(() => null),
        getDailyReport(selectedShopId, reportBody).catch(() => null),
        getTopProducts(selectedShopId, reportBody, 5).catch(() => null),
      );
    } else {
      promises.push(
        Promise.resolve(null),
        Promise.resolve(null),
        Promise.resolve(null),
      );
    }

    promises.push(
      getOrders(selectedShopId, {
        page: 0,
        size: 5,
        sort: "createdAt,desc",
        ...(recentOrdersBranchId ? { branchId: recentOrdersBranchId } : {}),
      }).catch(() => null),
    );

    try {
      const [summaryRes, dailyRes, topRes, ordersRes] =
        await Promise.all(promises);

      if (summaryRes?.data?.success) {
        setSummary(summaryRes.data.data);
      } else {
        setSummary(null);
        if (canViewReport) setReportError(true);
      }

      if (dailyRes?.data?.success) {
        const raw = dailyRes.data.data || [];
        const revenueKey = t("overview.chartLegend.revenue");
        const ordersKey = t("overview.chartLegend.orders");
        setChartData(
          raw.map((d) => ({
            date: format(new Date(d.date), "dd/MM", { locale: dateLocale }),
            [revenueKey]: d.totalRevenue || 0,
            [ordersKey]: d.totalOrders || 0,
          })),
        );
      } else {
        setChartData([]);
      }

      if (topRes?.data?.success) {
        setTopProducts(topRes.data.data || []);
      } else {
        setTopProducts([]);
      }

      if (ordersRes?.data?.success) {
        const orderData = ordersRes.data.data;
        const list =
          orderData?.content ?? (Array.isArray(orderData) ? orderData : []);
        setRecentOrders(list.slice(0, 5));
      } else {
        setRecentOrders([]);
      }
    } catch {
      toast.error(t("overview.report.loadError"));
    } finally {
      setLoading(false);
    }
  }, [
    selectedShopId,
    buildDateRange,
    branchFilter,
    recentOrdersBranchId,
    canViewReport,
    dateLocale,
    t,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData({ silent: true });
    setRefreshing(false);
  }, [fetchData]);

  const openOrder = useCallback(
    (order) => {
      const q = new URLSearchParams();
      if (order.orderCode?.trim()) {
        q.set("orderCode", order.orderCode.trim());
      } else if (order.id) {
        q.set("orderId", order.id);
      }
      navigate(q.toString() ? `/orders?${q.toString()}` : "/orders");
    },
    [navigate],
  );

  if (!selectedShop) return null;

  const roleLabel =
    shopRole &&
    t(`pages.shops.role.${shopRole}`, { defaultValue: shopRole });

  const rangeLabel =
    range === "month"
      ? t("overview.ranges.thisMonth")
      : t("overview.ranges.lastNDays", { count: Number(range) });

  const rankBadgeClass = (idx) => {
    if (idx === 0)
      return "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm";
    if (idx === 1)
      return "bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm";
    if (idx === 2)
      return "bg-gradient-to-br from-amber-700 to-orange-900 text-amber-50 shadow-sm";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 min-h-full bg-muted/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("overview.hello", {
              name: user?.fullName || t("overview.you"),
            })}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-2">
            <span className="truncate">{selectedShop.name}</span>
            {shopRole && (
              <Badge variant="outline" className="text-xs shrink-0">
                {isOwner && <Crown className="mr-1 h-3 w-3 inline" />}
                {roleLabel}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            disabled={loading || refreshing}
            onClick={handleRefresh}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">{t("overview.refresh")}</span>
          </Button>
          {branches?.length > 1 && (
            <Select
              value={branchFilter}
              onValueChange={(v) => setBranchFilter(v)}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder={t("overview.branchPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  {t("overview.allBranches")}
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
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === opt.value
                    ? "bg-background shadow-sm text-foreground ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <OverviewQuickActions />

      {loading ? (
        <div className="space-y-5">
          {canViewReport && <OverviewKpiSkeleton />}
          {canViewReport && <OverviewChartSkeleton />}
          <div
            className={cn(
              "grid gap-6",
              canViewReport ? "lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            {canViewReport && <OverviewListSkeleton />}
            <OverviewListSkeleton />
          </div>
        </div>
      ) : (
        <>
          {!canViewReport && (
            <Card className="border-dashed bg-card/80 shadow-sm">
              <CardContent className="py-6 flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t("overview.staffWelcome.title")}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t("overview.staffWelcome.desc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {summary && (
            <OverviewKpiCards
              summary={summary}
              rangeLabel={rangeLabel}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
            />
          )}

          {reportError && !summary && (
            <Card className="py-10 text-center border-amber-200/60 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/15">
              <p className="text-muted-foreground text-sm">
                {t("overview.report.permissionError")}
              </p>
            </Card>
          )}

          {canViewReport && chartData.length === 0 && !reportError && (
            <Card className="shadow-sm">
              <CardContent className="py-14 text-center">
                <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t("overview.report.chartEmpty")}
                </p>
              </CardContent>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card className="border-sky-200/50 dark:border-sky-900/35 shadow-md bg-gradient-to-b from-sky-50/50 to-card dark:from-sky-950/20 dark:to-card overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("overview.report.revenueTrend")}
                </CardTitle>
                <CardDescription>
                  {t("overview.report.revenueDescription", {
                    range: rangeLabel,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}M`
                            : v >= 1_000
                              ? `${(v / 1_000).toFixed(0)}K`
                              : v
                        }
                        className="text-muted-foreground"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey={t("overview.chartLegend.revenue")}
                        stroke="hsl(var(--primary))"
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey={t("overview.chartLegend.orders")}
                        stroke="hsl(var(--chart-2, 220 70% 50%))"
                        fill="none"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div
            className={cn(
              "grid gap-6",
              canViewReport ? "lg:grid-cols-2" : "grid-cols-1",
            )}
          >
            {canViewReport && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {t("overview.topProducts.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("overview.topProducts.topInRange", {
                        range: rangeLabel,
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate("/reports")}
                  >
                    {t("common.viewMore")}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="px-0">
                  {topProducts.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground px-6">
                      {t("overview.topProducts.empty")}
                    </p>
                  ) : (
                  <div className="divide-y">
                    {topProducts.map((p, idx) => (
                      <div
                        key={p.productId || idx}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankBadgeClass(idx)}`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(p.totalQuantitySold)}{" "}
                            {t("overview.topProducts.soldUnit")}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(p.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {t("overview.recentOrders.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("overview.recentOrders.subtitle")}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/orders")}
                >
                  {t("common.viewAll")}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-0">
                {recentOrders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("overview.recentOrders.empty")}
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentOrders.map((order) => {
                      const statusLabel = t(
                        `overview.orderStatus.${order.status}`,
                        { defaultValue: order.status },
                      );
                      const cls = ORDER_STATUS_CLS[order.status] || "";
                      return (
                        <button
                          type="button"
                          key={order.id}
                          onClick={() => openOrder(order)}
                          className="w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/15 to-violet-500/15 ring-1 ring-sky-200/60 dark:ring-sky-800/50">
                            <ShoppingCart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {order.customerName ||
                                (order.orderCode?.trim()
                                  ? t("overview.recentOrders.orderCode", {
                                      code: order.orderCode.trim(),
                                    })
                                  : t("overview.recentOrders.orderShort", {
                                      id: order.id?.slice(-6),
                                    }))}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {order.createdAt
                                ? format(
                                    new Date(order.createdAt),
                                    "dd/MM HH:mm",
                                    { locale: dateLocale },
                                  )
                                : "-"}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(
                                order.taxSnapshot?.grandTotal ??
                                  order.totalPrice ??
                                  0,
                              )}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${cls}`}
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewPage;
