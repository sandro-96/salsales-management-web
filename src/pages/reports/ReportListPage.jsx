import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import {
  format,
  subDays,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";
import {
  Loader2,
  Download,
  Warehouse,
  CalendarIcon,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Receipt,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReportMetricStatCards } from "@/components/reports/ReportMetricStatCards.jsx";
import {
  dataTableContainer,
  listBranchSelectWrap,
  listFilterSelectWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

import {
  getReportSummary,
  getDailyReport,
  getTopProducts,
  exportDailyReport,
  exportTopProducts,
} from "../../api/reportApi.js";

const toISODate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const DEFAULT_STATUS = "COMPLETED";

const getDefaultDateRange = () => ({
  startDate: subDays(new Date(), 30),
  endDate: new Date(),
});

const detectDatePreset = (start, end) => {
  const endDay = startOfDay(end);
  const today = startOfDay(new Date());
  if (endDay.getTime() !== today.getTime()) return null;
  const days = differenceInCalendarDays(endDay, startOfDay(start));
  if (days === 7) return "7";
  if (days === 30) return "30";
  if (days === 90) return "90";
  return null;
};

const DATE_PRESET_KEYS = ["7", "30", "90"];

const ReportListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;

  const formatCurrency = useCallback(
    (value, { round = false } = {}) => {
      const n = Number(value || 0);
      const v = round ? Math.round(n) : n;
      return v.toLocaleString(numberLocale) + "đ";
    },
    [numberLocale],
  );

  const formatNumber = useCallback(
    (value) => Number(value || 0).toLocaleString(numberLocale),
    [numberLocale],
  );

  const formatDateShort = useCallback(
    (dateStr) => {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return format(d, "dd/MM", { locale: dateLocale });
    },
    [dateLocale],
  );

  const formatDateFull = useCallback(
    (dateStr) => {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return format(d, "dd/MM/yyyy", { locale: dateLocale });
    },
    [dateLocale],
  );

  const chartRevenueLabel = t("pages.reports.list.chartRevenue");
  const chartOrdersLabel = t("pages.reports.list.chartOrders");
  const chartProductsLabel = t("pages.reports.list.chartProducts");

  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (!active || !payload?.length) return null;
      const currencyNames = new Set([chartRevenueLabel]);
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm" style={{ color: p.color }}>
              {p.name}:{" "}
              {currencyNames.has(p.name)
                ? formatCurrency(p.value)
                : formatNumber(p.value)}
            </p>
          ))}
        </div>
      );
    },
    [chartRevenueLabel, formatCurrency, formatNumber],
  );

  const [searchParams] = useSearchParams();
  const { selectedShopId, branches } = useShop();
  const shopId = selectedShopId;

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(() => defaultRange.startDate);
  const [endDate, setEndDate] = useState(() => defaultRange.endDate);
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const startDateBlockRef = useRef(null);
  const endDateBlockRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildRequest = useCallback(
    () => ({
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      branchId: branchFilter !== "__all__" ? branchFilter : null,
      status: statusFilter !== "__all__" ? statusFilter : null,
    }),
    [startDate, endDate, branchFilter, statusFilter],
  );

  const fetchAll = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const request = buildRequest();
    try {
      const [summaryRes, dailyRes, topRes] = await Promise.all([
        getReportSummary(shopId, request),
        getDailyReport(shopId, request),
        getTopProducts(shopId, request, 10),
      ]);
      setSummary(summaryRes.data?.data ?? null);
      setDailyData(dailyRes.data?.data ?? []);
      setTopProducts(topRes.data?.data ?? []);
    } catch (err) {
      console.error("Fetch reports error:", err);
      toast.error(t("pages.reports.list.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, buildRequest, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!startDateOpen) return;
    startDateBlockRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [startDateOpen]);

  useEffect(() => {
    if (!endDateOpen) return;
    endDateBlockRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [endDateOpen]);

  const activeDatePreset = useMemo(
    () => detectDatePreset(startDate, endDate),
    [startDate, endDate],
  );

  const hasActiveFilters = useMemo(() => {
    if (branchFilter !== "__all__") return true;
    if (statusFilter !== DEFAULT_STATUS) return true;
    if (detectDatePreset(startDate, endDate) !== "30") return true;
    return false;
  }, [branchFilter, statusFilter, startDate, endDate]);

  const clearFilters = () => {
    const range = getDefaultDateRange();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setBranchFilter("__all__");
    setStatusFilter(DEFAULT_STATUS);
    setStartDateOpen(false);
    setEndDateOpen(false);
  };

  const applyDatePreset = (days) => {
    const end = new Date();
    setEndDate(end);
    setStartDate(subDays(end, days));
    setStartDateOpen(false);
    setEndDateOpen(false);
  };

  useEffect(() => {
    const bid = searchParams.get("branchId");
    if (!bid) return;
    if (!Array.isArray(branches) || branches.length === 0) return;
    const ok = branches.some((b) => b.id === bid);
    if (!ok) return;
    if (branchFilter === bid) return;
    setBranchFilter(bid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, branches]);

  const handleExportDaily = async () => {
    setExporting(true);
    try {
      const params = {
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
      };
      if (branchFilter !== "__all__") params.branchId = branchFilter;
      const res = await exportDailyReport(shopId, params);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "daily-report.xlsx";
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(t("pages.reports.list.exportDailySuccess"));
    } catch {
      toast.error(t("pages.reports.list.exportFail"));
    } finally {
      setExporting(false);
    }
  };

  const handleExportTopProducts = async () => {
    setExporting(true);
    try {
      const res = await exportTopProducts(shopId, buildRequest(), 10);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "top-products.xlsx";
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(t("pages.reports.list.exportTopSuccess"));
    } catch {
      toast.error(t("pages.reports.list.exportFail"));
    } finally {
      setExporting(false);
    }
  };

  const sortedDailyData = useMemo(
    () =>
      [...dailyData].sort((a, b) =>
        String(a?.date ?? "").localeCompare(String(b?.date ?? "")),
      ),
    [dailyData],
  );

  const chartData = useMemo(
    () =>
      sortedDailyData.map((d) => ({
        date: formatDateShort(d.date),
        revenue: d.totalRevenue,
        orders: d.totalOrders,
        products: d.totalProductsSold,
      })),
    [sortedDailyData, formatDateShort],
  );

  const chartRangeLabel = useMemo(
    () =>
      `${format(startDate, "dd/MM/yyyy", { locale: dateLocale })} — ${format(endDate, "dd/MM/yyyy", { locale: dateLocale })}`,
    [startDate, endDate, dateLocale],
  );

  const orderStatusLabel = (status) =>
    t(`pages.orders.status.${status}`, { defaultValue: status });

  const metricItems = useMemo(
    () => [
      {
        key: "orders",
        title: t("pages.reports.list.statOrders"),
        value: formatNumber(summary?.totalOrders),
        icon: ShoppingCart,
      },
      {
        key: "products",
        title: t("pages.reports.list.statProductsSold"),
        value: formatNumber(summary?.totalProductsSold),
        icon: Package,
      },
      {
        key: "revenue",
        title: t("pages.reports.list.statRevenue"),
        value: formatCurrency(summary?.totalRevenue),
        icon: DollarSign,
        description: t("pages.reports.list.statRevenueDesc"),
        hint: t("pages.reports.list.statRevenueHint"),
      },
      {
        key: "amount",
        title: t("pages.reports.list.statAmount"),
        value: formatCurrency(summary?.totalAmount),
        icon: Receipt,
        description: t("pages.reports.list.statAmountDesc"),
      },
      {
        key: "avg",
        title: t("pages.reports.list.statAvgOrder"),
        value: formatCurrency(summary?.averageOrderValue, { round: true }),
        icon: TrendingUp,
        hint: t("pages.reports.list.statAvgOrderHint"),
      },
    ],
    [t, summary, formatNumber, formatCurrency],
  );

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4 min-w-0">
        <ListPageHeader
          icon={BarChart3}
          title={t("pages.reports.list.title")}
          subtitle={t("pages.reports.list.subtitle")}
        />

        <div className={listToolbarRoot}>
          <div className={cn(listToolbarFilters, "flex-col items-stretch")}>
            <div className="flex flex-wrap gap-1 rounded-lg border border-primary/20 bg-primary/[0.06] p-1 w-full sm:w-auto">
              {DATE_PRESET_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyDatePreset(Number(key))}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activeDatePreset === key
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {t(`pages.reports.list.preset${key}d`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
              <div ref={startDateBlockRef} className="space-y-1.5 min-w-0">
                <span className="text-xs text-muted-foreground">
                  {t("pages.reports.list.fromDate")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !startDate && "text-muted-foreground",
                  )}
                  aria-expanded={startDateOpen}
                  onClick={() => {
                    setEndDateOpen(false);
                    setStartDateOpen((v) => !v);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {startDate
                    ? format(startDate, "dd/MM/yyyy", { locale: dateLocale })
                    : t("pages.reports.list.fromDate")}
                </Button>
                {startDateOpen && (
                  <div className="flex justify-center overflow-x-auto rounded-md border bg-popover shadow-sm">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        if (d) {
                          d.setHours(0, 0, 0, 0);
                          setStartDate(d);
                          if (endDate && d > endDate) setEndDate(d);
                          setStartDateOpen(false);
                        }
                      }}
                      locale={dateLocale}
                      className="p-2 sm:p-3"
                    />
                  </div>
                )}
              </div>

              <div ref={endDateBlockRef} className="space-y-1.5 min-w-0">
                <span className="text-xs text-muted-foreground">
                  {t("pages.reports.list.toDate")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !endDate && "text-muted-foreground",
                  )}
                  aria-expanded={endDateOpen}
                  onClick={() => {
                    setStartDateOpen(false);
                    setEndDateOpen((v) => !v);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {endDate
                    ? format(endDate, "dd/MM/yyyy", { locale: dateLocale })
                    : t("pages.reports.list.toDate")}
                </Button>
                {endDateOpen && (
                  <div className="flex justify-center overflow-x-auto rounded-md border bg-popover shadow-sm">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => {
                        if (d) {
                          d.setHours(0, 0, 0, 0);
                          setEndDate(d);
                          setEndDateOpen(false);
                        }
                      }}
                      disabled={(d) => startDate && d < startDate}
                      locale={dateLocale}
                      className="p-2 sm:p-3"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
              {branches?.length > 0 && (
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className={listBranchSelectWrap}>
                    <Warehouse className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="__all__">
                      {t("pages.reports.list.allBranches")}
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={listFilterSelectWrap}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">
                    {t("pages.reports.list.allStatuses")}
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    {orderStatusLabel("COMPLETED")}
                  </SelectItem>
                  <SelectItem value="PENDING">
                    {orderStatusLabel("PENDING")}
                  </SelectItem>
                  <SelectItem value="CONFIRMED">
                    {orderStatusLabel("CONFIRMED")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {orderStatusLabel("CANCELLED")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={listToolbarActions}>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={clearFilters}
              >
                {t("pages.reports.list.clearFilters")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={loading}
              onClick={fetchAll}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("pages.reports.list.refresh")}
            </Button>
          </div>
        </div>

        <ReportMetricStatCards
          items={metricItems}
          loading={loading && !summary}
          hintAria={t("pages.reports.list.metricHintAria")}
        />

        <Tabs defaultValue="daily" className="w-full min-w-0">

          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger
                value="daily"
                className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                {t("pages.reports.list.tabDaily")}
              </TabsTrigger>
              <TabsTrigger
                value="top-products"
                className="data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
              >
                <TrendingUp className="h-4 w-4 mr-1.5" />
                {t("pages.reports.list.tabTopProducts")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDaily}
                disabled={exporting || dailyData.length === 0}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {t("pages.reports.list.exportExcel")}
              </Button>
            </div>

            {dailyData.length > 0 ? (
              <>
                <Card className="overflow-hidden">
                  <CardHeader className="bg-emerald-500/[0.05] pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {t("pages.reports.list.chartTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("pages.reports.list.chartRange", { range: chartRangeLabel })}
                      {sortedDailyData.length > 0 ? (
                        <span className="text-muted-foreground">
                          {" "}
                          {t("pages.reports.list.chartDaysWithData", {
                            count: sortedDailyData.length,
                          })}
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280} className="sm:!h-[350px]">
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="date"
                          fontSize={12}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          fontSize={12}
                          className="fill-muted-foreground"
                          tickFormatter={(v) =>
                            v >= 1_000_000
                              ? `${(v / 1_000_000).toFixed(1)}M`
                              : v >= 1_000
                                ? `${(v / 1_000).toFixed(0)}K`
                                : v
                          }
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          name={chartRevenueLabel}
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="bg-sky-500/[0.05] pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      {t("pages.reports.list.dailyDetailTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className={dataTableContainer}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("pages.reports.list.colDate")}</TableHead>
                          <TableHead className="text-right">
                            {t("pages.reports.list.colOrders")}
                          </TableHead>
                          <TableHead className="text-right">
                            {t("pages.reports.list.colProducts")}
                          </TableHead>
                          <TableHead className="text-right text-emerald-600 dark:text-emerald-400">
                            {t("pages.reports.list.colRevenue")}
                          </TableHead>
                          <TableHead className="text-right text-teal-600 dark:text-teal-400">
                            {t("pages.reports.list.colAmount")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedDailyData.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {formatDateFull(d.date)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(d.totalOrders)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(d.totalProductsSold)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(d.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-teal-600 dark:text-teal-400">
                              {formatCurrency(d.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    {loading
                      ? t("pages.reports.list.loading")
                      : t("pages.reports.list.emptyDaily")}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="top-products" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTopProducts}
                disabled={exporting || topProducts.length === 0}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {t("pages.reports.list.exportExcel")}
              </Button>
            </div>

            {topProducts.length > 0 ? (
              <Card className="overflow-hidden">
                <CardHeader className="bg-violet-500/[0.05] pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    {t("pages.reports.list.topProductsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.reports.list.topProductsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className={dataTableContainer}>
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          #
                        </TableHead>
                        <TableHead>{t("pages.reports.list.colProduct")}</TableHead>
                        <TableHead className="text-right">
                          {t("pages.reports.list.colQtySold")}
                        </TableHead>
                        <TableHead className="text-right text-emerald-600 dark:text-emerald-400">
                          {t("pages.reports.list.colRevenue")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((p, i) => (
                        <TableRow key={p.productId || i}>
                          <TableCell className="text-center">
                            {i < 3 ? (
                              <Badge
                                variant={
                                  i === 0
                                    ? "default"
                                    : i === 1
                                      ? "secondary"
                                      : "outline"
                                }
                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                              >
                                {i + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {i + 1}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {p.productName}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(p.totalQuantitySold)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                    </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    {loading
                      ? t("pages.reports.list.loading")
                      : t("pages.reports.list.emptyTopProducts")}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportListPage;
