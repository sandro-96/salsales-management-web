import { useState, useEffect, useCallback } from "react";
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
    isOwner || shopRole === "MANAGER" || shopRole === "ADMIN";

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
  }, [selectedShopId, buildDateRange, branchFilter, canViewReport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!selectedShop) return null;

  const rangeLabel = range === "month" ? "tháng này" : `${range} ngày qua`;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
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
          <div className="flex rounded-lg border bg-muted p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === opt.value
                    ? "bg-background shadow-sm text-foreground"
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Doanh thu
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Đơn hàng
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sản phẩm đã bán
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Giá trị TB/đơn
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <Card className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Không thể tải dữ liệu báo cáo. Bạn có thể không có quyền xem báo
                cáo.
              </p>
            </Card>
          )}

          {/* ── Revenue Chart ───────────────────────────────────────── */}
          {chartData.length > 0 && (
            <Card>
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
              <Card>
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
                        className="flex items-center gap-3 px-6 py-3"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
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
            <Card>
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
                          className="flex items-center gap-3 px-6 py-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
                                order.totalAmount || order.totalPrice,
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
