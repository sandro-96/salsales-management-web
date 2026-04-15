import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { cn } from "@/lib/utils";

import {
  getReportSummary,
  getDailyReport,
  getTopProducts,
  exportDailyReport,
  exportTopProducts,
} from "../../api/reportApi.js";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatDateShort = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return format(d, "dd/MM", { locale: vi });
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy", { locale: vi });
};

const toISODate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const StatCard = ({ title, value, icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon ? React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" }) : null}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: {p.name.includes("Doanh thu") || p.name.includes("Tổng tiền")
            ? formatCurrency(p.value)
            : formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
};

const ReportListPage = () => {
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
      toast.error("Không thể tải dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [shopId, buildRequest]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Branch deeplink: /reports?branchId=...
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
      toast.success("Xuất báo cáo theo ngày thành công.");
    } catch {
      toast.error("Không thể xuất file Excel.");
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
      toast.success("Xuất sản phẩm bán chạy thành công.");
    } catch {
      toast.error("Không thể xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

  const chartData = useMemo(
    () =>
      dailyData.map((d) => ({
        date: formatDateShort(d.date),
        "Doanh thu": d.totalRevenue,
        "Đơn hàng": d.totalOrders,
        "Sản phẩm": d.totalProductsSold,
      })),
    [dailyData],
  );

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Báo cáo doanh thu
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Phân tích doanh thu, đơn hàng và sản phẩm bán chạy.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start date */}
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
                  ? format(startDate, "dd/MM/yyyy", { locale: vi })
                  : "Từ ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
                locale={vi}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">—</span>

          {/* End date */}
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
                  ? format(endDate, "dd/MM/yyyy", { locale: vi })
                  : "Đến ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => d && setEndDate(d)}
                disabled={(d) => startDate && d < startDate}
                locale={vi}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Branch filter */}
          {branches?.length > 0 && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="__all__">Tất cả chi nhánh</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
              <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
              <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
            </SelectContent>
          </Select>

          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Tổng đơn hàng"
            value={formatNumber(summary?.totalOrders)}
            icon={ShoppingCart}
          />
          <StatCard
            title="Sản phẩm đã bán"
            value={formatNumber(summary?.totalProductsSold)}
            icon={Package}
          />
          <StatCard
            title="Doanh thu"
            value={formatCurrency(summary?.totalRevenue)}
            icon={DollarSign}
            description="Tổng tiền hàng trên đơn (totalPrice); với giá đã gồm VAT thường bằng tổng thu"
          />
          <StatCard
            title="Tổng tiền thu"
            value={formatCurrency(summary?.totalAmount)}
            icon={Receipt}
            description="Đã bao gồm thuế"
          />
          <StatCard
            title="TB / đơn hàng"
            value={formatCurrency(summary?.averageOrderValue)}
            icon={TrendingUp}
          />
        </div>

        {/* Tabs: Daily chart + Top products */}
        <Tabs defaultValue="daily" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="daily">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Theo ngày
              </TabsTrigger>
              <TabsTrigger value="top-products">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Bán chạy
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Daily report tab */}
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
                Xuất Excel
              </Button>
            </div>

            {dailyData.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Biểu đồ doanh thu theo ngày
                    </CardTitle>
                    <CardDescription>
                      Từ {formatDateFull(dailyData[0]?.date)} đến{" "}
                      {formatDateFull(dailyData[dailyData.length - 1]?.date)}
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
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="Doanh thu"
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
                      Chi tiết theo ngày
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead className="text-right">Đơn hàng</TableHead>
                          <TableHead className="text-right">
                            Sản phẩm
                          </TableHead>
                          <TableHead className="text-right">
                            Doanh thu
                          </TableHead>
                          <TableHead className="text-right">
                            Tổng tiền
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyData.map((d, i) => (
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
                      ? "Đang tải dữ liệu..."
                      : "Không có dữ liệu trong khoảng thời gian này."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Top products tab */}
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
                Xuất Excel
              </Button>
            </div>

            {topProducts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top 10 sản phẩm bán chạy
                  </CardTitle>
                  <CardDescription>
                    Sắp xếp theo số lượng bán giảm dần
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          #
                        </TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">
                          Số lượng bán
                        </TableHead>
                        <TableHead className="text-right">Doanh thu</TableHead>
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
                      ? "Đang tải dữ liệu..."
                      : "Không có dữ liệu sản phẩm bán chạy."}
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
