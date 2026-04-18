import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../hooks/useShop";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { format, subDays, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Crown,
  ArrowRight,
  Clock,
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

import {
  getReportSummary,
  getDailyReport,
  getTopProducts,
} from "../api/reportApi.js";
import { getOrders } from "../api/orderApi.js";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const toISODate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ORDER_STATUS_MAP = {
  PENDING: { label: "Chờ xử lý", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-800" },
  SHIPPING: { label: "Đang giao", cls: "bg-violet-100 text-violet-800" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-800" },
};

const RANGE_OPTIONS = [
  { value: "7", label: "7 ngày" },
  { value: "14", label: "14 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}:{" "}
          {p.name === "Doanh thu"
            ? formatCurrency(p.value)
            : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
};

const OverviewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedShop, selectedShopId, branches, isOwner, shopRole } =
    useShop();

  const [range, setRange] = useState("7");
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);

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

  const fetchData = useCallback(async () => {
    if (!selectedShopId) return;
    setLoading(true);
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
        setChartData(
          raw.map((d) => ({
            date: format(new Date(d.date), "dd/MM", { locale: vi }),
            "Doanh thu": d.totalRevenue || 0,
            "Đơn hàng": d.totalOrders || 0,
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
      toast.error("Không thể tải dữ liệu tổng quan.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedShopId,
    buildDateRange,
    branchFilter,
    recentOrdersBranchId,
    canViewReport,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!selectedShop) return null;

  const rangeLabel = range === "month" ? "tháng này" : `${range} ngày qua`;

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
    <div className="p-4 md:p-6 space-y-6 min-h-full bg-gradient-to-br from-sky-50/50 via-background to-violet-50/40 dark:from-sky-950/20 dark:via-background dark:to-violet-950/20">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-700 via-violet-600 to-violet-700 bg-clip-text text-transparent dark:from-sky-300 dark:via-violet-400 dark:to-fuchsia-400">
            Xin chào, {user?.fullName || "bạn"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedShop.name}
            {shopRole && (
              <Badge variant="outline" className="ml-2 text-xs">
                {isOwner && <Crown className="mr-1 h-3 w-3 inline" />}
                {shopRole}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {branches?.length > 1 && (
            <Select
              value={branchFilter}
              onValueChange={(v) => setBranchFilter(v)}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả chi nhánh</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex rounded-lg border border-sky-200/70 dark:border-sky-800/40 bg-gradient-to-r from-sky-50/90 to-violet-50/70 dark:from-sky-950/40 dark:to-violet-950/30 p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === opt.value
                    ? "bg-background shadow-sm text-foreground ring-1 ring-sky-200/80 dark:ring-sky-700/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ───────────────────────────────────────────── */}
          {summary && (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/25 dark:to-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Doanh thu
                  </CardTitle>
                  <div className="rounded-lg bg-emerald-500/15 p-2 ring-1 ring-emerald-500/20">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trong {rangeLabel}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-sky-200/70 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/80 to-card dark:from-sky-950/25 dark:to-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Đơn hàng
                  </CardTitle>
                  <div className="rounded-lg bg-sky-500/15 p-2 ring-1 ring-sky-500/20">
                    <ShoppingCart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(summary.totalOrders)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trong {rangeLabel}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-violet-200/70 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/80 to-card dark:from-violet-950/25 dark:to-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sản phẩm đã bán
                  </CardTitle>
                  <div className="rounded-lg bg-violet-500/15 p-2 ring-1 ring-violet-500/20">
                    <Package className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(summary.totalProductsSold)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trong {rangeLabel}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Giá trị TB/đơn
                  </CardTitle>
                  <div className="rounded-lg bg-amber-500/15 p-2 ring-1 ring-amber-500/20">
                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.averageOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trong {rangeLabel}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {reportError && !summary && (
            <Card className="py-10 text-center border-amber-200/60 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/15">
              <p className="text-muted-foreground text-sm">
                Không thể tải dữ liệu báo cáo. Bạn có thể không có quyền xem báo
                cáo.
              </p>
            </Card>
          )}

          {/* ── Revenue Chart ───────────────────────────────────────── */}
          {chartData.length > 0 && (
            <Card className="border-sky-200/50 dark:border-sky-900/35 shadow-md bg-gradient-to-b from-sky-50/50 to-card dark:from-sky-950/20 dark:to-card overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Xu hướng doanh thu</CardTitle>
                <CardDescription>
                  Biểu đồ doanh thu và đơn hàng theo ngày trong {rangeLabel}
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
                        dataKey="Doanh thu"
                        stroke="hsl(var(--primary))"
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="Đơn hàng"
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

          {/* ── Bottom Two-Column ────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Products */}
            {topProducts.length > 0 && (
              <Card className="border-violet-200/40 dark:border-violet-900/30 shadow-sm bg-gradient-to-br from-violet-50/30 to-card dark:from-violet-950/15 dark:to-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Sản phẩm bán chạy
                    </CardTitle>
                    <CardDescription>Top 5 trong {rangeLabel}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate("/reports")}
                  >
                    Xem thêm
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="divide-y">
                    {topProducts.map((p, idx) => (
                      <div
                        key={p.productId || idx}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors"
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
                            {formatNumber(p.totalQuantitySold)} đã bán
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(p.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Orders */}
            <Card className="border-sky-200/40 dark:border-sky-900/30 shadow-sm bg-gradient-to-br from-sky-50/25 to-card dark:from-sky-950/15 dark:to-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
                  <CardDescription>5 đơn hàng mới nhất</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/orders")}
                >
                  Xem tất cả
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="px-0">
                {recentOrders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có đơn hàng nào.
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentOrders.map((order) => {
                      const statusCfg = ORDER_STATUS_MAP[order.status] || {
                        label: order.status,
                        cls: "",
                      };
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-3 px-6 py-3 hover:bg-sky-50/60 dark:hover:bg-sky-950/25 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/15 to-violet-500/15 ring-1 ring-sky-200/60 dark:ring-sky-800/50">
                            <ShoppingCart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {order.customerName ||
                                (order.orderCode?.trim()
                                  ? `Đơn ${order.orderCode.trim()}`
                                  : `Đơn #${order.id?.slice(-6)}`)}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {order.createdAt
                                ? format(
                                    new Date(order.createdAt),
                                    "dd/MM HH:mm",
                                    {
                                      locale: vi,
                                    },
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
                              className={`text-[10px] ${statusCfg.cls}`}
                            >
                              {statusCfg.label}
                            </Badge>
                          </div>
                        </div>
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
