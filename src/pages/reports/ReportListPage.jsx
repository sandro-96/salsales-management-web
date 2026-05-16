import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
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
  Info,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

const StatCard = ({
  title,
  value,
  icon,
  description,
  hint,
  hintAria,
  className,
}) => (
  <Card className={cn("flex h-full min-h-0 flex-col", className)}>
    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <CardTitle className="truncate text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-md text-muted-foreground outline-none ring-offset-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={hintAria}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-left leading-snug">
              {hint}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {icon ? React.createElement(icon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }) : null}
    </CardHeader>
    <CardContent className="flex flex-1 flex-col pt-0">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </CardContent>
  </Card>
);

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

  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("COMPLETED");

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

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("pages.reports.list.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pages.reports.list.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] justify-start text-left font-normal text-sm",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate
                  ? format(startDate, "dd/MM/yyyy", { locale: dateLocale })
                  : t("pages.reports.list.fromDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                locale={dateLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">—</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] justify-start text-left font-normal text-sm",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate
                  ? format(endDate, "dd/MM/yyyy", { locale: dateLocale })
                  : t("pages.reports.list.toDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => d && setEndDate(d)}
                disabled={(d) => startDate && d < startDate}
                locale={dateLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {branches?.length > 0 && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
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
            <SelectTrigger className="w-[170px]">
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

          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-5">
          <StatCard
            title={t("pages.reports.list.statOrders")}
            value={formatNumber(summary?.totalOrders)}
            icon={ShoppingCart}
          />
          <StatCard
            title={t("pages.reports.list.statProductsSold")}
            value={formatNumber(summary?.totalProductsSold)}
            icon={Package}
          />
          <StatCard
            title={t("pages.reports.list.statRevenue")}
            value={formatCurrency(summary?.totalRevenue)}
            icon={DollarSign}
            description={t("pages.reports.list.statRevenueDesc")}
            hint={t("pages.reports.list.statRevenueHint")}
            hintAria={t("pages.reports.list.metricHintAria")}
          />
          <StatCard
            title={t("pages.reports.list.statAmount")}
            value={formatCurrency(summary?.totalAmount)}
            icon={Receipt}
            description={t("pages.reports.list.statAmountDesc")}
          />
          <StatCard
            title={t("pages.reports.list.statAvgOrder")}
            value={formatCurrency(summary?.averageOrderValue, { round: true })}
            icon={TrendingUp}
            hint={t("pages.reports.list.statAvgOrderHint")}
            hintAria={t("pages.reports.list.metricHintAria")}
          />
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="daily">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                {t("pages.reports.list.tabDaily")}
              </TabsTrigger>
              <TabsTrigger value="top-products">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
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
                    <ResponsiveContainer width="100%" height={350}>
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
                          fill="hsl(var(--chart-1, 220 70% 50%))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("pages.reports.list.dailyDetailTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
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
                          <TableHead className="text-right">
                            {t("pages.reports.list.colRevenue")}
                          </TableHead>
                          <TableHead className="text-right">
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
                            <TableCell className="text-right">
                              {formatCurrency(d.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(d.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("pages.reports.list.topProductsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("pages.reports.list.topProductsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                        <TableHead className="text-right">
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
                          <TableCell className="text-right">
                            {formatCurrency(p.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
