import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Loader2,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useShop } from "../../hooks/useShop.js";
import { getStaffShopOverview } from "../../api/staffProfileApi.js";
import { leaveShopMonthSummary } from "../../api/leaveApi.js";
import { payrollGenerate } from "../../api/payrollApi.js";
import {
  SHOP_ROLE,
  SHOP_ROLE_BADGE_VARIANT,
  SHOP_ROLE_LABELS,
} from "../../constants/shopRoles.js";

const CONTRACT_LABELS = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  PROBATION: "Thử việc",
  CONTRACT: "Hợp đồng",
};

const formatVnd = (value) => {
  const n = Number(value || 0);
  return `${Math.round(n).toLocaleString("vi-VN")} ₫`;
};

const formatMinutes = (m) => {
  const n = Number(m || 0);
  if (!Number.isFinite(n) || n <= 0) return "0h";
  const h = Math.floor(n / 60);
  const min = n % 60;
  return min === 0 ? `${h}h` : `${h}h ${min}m`;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const StatCard = ({ icon: Icon, label, value, hint, accent }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
      {Icon ? (
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent || "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
      {hint ? (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      ) : null}
    </CardContent>
  </Card>
);

const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const { selectedShopId } = useShop();
  const shopId = selectedShopId;

  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaveSummary, setLeaveSummary] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await getStaffShopOverview(shopId, { month });
      setData(res.data?.data ?? null);
    } catch (err) {
      console.error("Fetch staff overview error:", err);
      toast.error("Không thể tải tổng quan nhân sự.");
    } finally {
      setLoading(false);
    }
  }, [shopId, month]);

  const fetchLeaveSummary = useCallback(async () => {
    if (!shopId) return;
    try {
      const res = await leaveShopMonthSummary(shopId, { month });
      setLeaveSummary(res.data?.data ?? null);
    } catch (err) {
      console.error("Fetch leave summary error:", err);
      setLeaveSummary(null);
    }
  }, [shopId, month]);

  useEffect(() => {
    fetchOverview();
    fetchLeaveSummary();
  }, [fetchOverview, fetchLeaveSummary]);

  const roleRows = useMemo(() => {
    if (!data?.staffByRole) return [];
    return Object.values(SHOP_ROLE)
      .map((value) => ({
        role: value,
        label: SHOP_ROLE_LABELS[value] || value,
        count: Number(data.staffByRole[value] || 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const branchRows = data?.staffByBranch ?? [];
  const contractEntries = useMemo(() => {
    if (!data?.payrollByContract) return [];
    return Object.entries(data.payrollByContract).map(([key, val]) => ({
      key,
      label: CONTRACT_LABELS[key] || key,
      staffCount: Number(val?.staffCount || 0),
      totalSalary: Number(val?.totalSalary || 0),
    }));
  }, [data]);

  const payrollEnabled = !!data?.payroll?.enabled;
  const payrollStatus = data?.payroll?.status;

  const handleGeneratePayroll = async () => {
    if (!shopId) return;
    try {
      await payrollGenerate(shopId, { month });
      toast.success("Đã tạo / tính lại bảng lương.");
      fetchOverview();
    } catch (err) {
      console.error("Generate payroll error:", err);
      toast.error(err.response?.data?.message || "Không thể tạo bảng lương.");
    }
  };

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/staffs")}
            aria-label="Về danh sách nhân sự"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Tổng quan nhân sự
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi tổng số nhân sự, chi phí lương ước tính và phân bố theo
              chi nhánh / vai trò.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="w-[180px]"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          Chưa có dữ liệu để hiển thị.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Tổng nhân sự"
              value={data.totalStaff?.toLocaleString("vi-VN") || 0}
              hint={`${data.systemStaff || 0} hệ thống · ${
                data.externalStaff || 0
              } ngoài HT`}
              accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
            />
            <StatCard
              icon={Wallet}
              label="Tổng lương / tháng"
              value={formatVnd(data.totalMonthlySalary)}
              hint={`${data.staffWithSalary || 0} người đã khai báo lương`}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
            />
            <StatCard
              icon={Briefcase}
              label="Lương trung bình"
              value={formatVnd(data.averageSalary)}
              hint="Tính trên người có khai báo lương"
              accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
            />
            <StatCard
              icon={Shield}
              label="Nhân sự mới trong tháng"
              value={data.newStaffThisMonth?.toLocaleString("vi-VN") || 0}
              hint={`Theo tháng ${data.month || month}`}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" /> Theo vai trò
                </CardTitle>
                <CardDescription>
                  Số lượng nhân sự hệ thống tương ứng từng vai trò.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vai trò</TableHead>
                      <TableHead className="text-right">Số người</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground py-6"
                        >
                          Chưa có dữ liệu vai trò.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roleRows.map((row) => (
                        <TableRow key={row.role}>
                          <TableCell>
                            <Badge
                              variant={
                                SHOP_ROLE_BADGE_VARIANT[row.role] || "outline"
                              }
                            >
                              {row.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {row.count.toLocaleString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" /> Theo chi nhánh
                </CardTitle>
                <CardDescription>
                  Phân bố nhân sự theo chi nhánh đã gán.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chi nhánh</TableHead>
                      <TableHead className="text-right">Số người</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground py-6"
                        >
                          Chưa có chi nhánh nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      branchRows.map((row, idx) => (
                        <TableRow key={row.branchId || `__unassigned__-${idx}`}>
                          <TableCell className="font-medium">
                            {row.branchName || "—"}
                            {!row.branchId && (
                              <Badge variant="outline" className="ml-2">
                                Chưa gán
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(row.count || 0).toLocaleString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" /> Chi phí lương theo loại hợp đồng
              </CardTitle>
              <CardDescription>
                Tổng lương cố định khai báo trong hồ sơ nhân sự, nhóm theo loại
                hợp đồng. Sẽ kết hợp với chấm công & thưởng/phạt thực tế khi
                bật phase Payroll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại hợp đồng</TableHead>
                    <TableHead className="text-right">Số nhân sự</TableHead>
                    <TableHead className="text-right">Tổng lương</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-6"
                      >
                        Chưa có dữ liệu hợp đồng / lương.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contractEntries.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">
                          {row.staffCount.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatVnd(row.totalSalary)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chấm công</CardTitle>
                <CardDescription>
                  {data?.attendance?.enabled
                    ? `Theo tháng ${data.month || month}`
                    : "Đang chuẩn bị (phase 2)."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.attendance?.enabled ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tổng ca/session</span>
                      <span className="font-semibold">
                        {Number(data.attendance.totalShiftsScheduled || 0).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ca đã hoàn tất</span>
                      <span className="font-semibold">
                        {Number(data.attendance.totalShiftsCompleted || 0).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tổng giờ làm</span>
                      <span className="font-semibold">
                        {formatMinutes(data.attendance.totalWorkMinutes)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Đi muộn / về sớm sẽ được tính khi bạn cấu hình ca chuẩn
                        ở bước tiếp theo.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Số ca làm, đi muộn, về sớm sẽ hiển thị tại đây sau khi bật
                    module Chấm công.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Nghỉ phép</CardTitle>
                <CardDescription>
                  Theo tháng {data?.month || month} (tổng quan)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng đơn</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.totalRequests || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chờ duyệt</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.pendingRequests || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đã duyệt</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.approvedRequests || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Từ chối</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.rejectedRequests || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Bảng lương</CardTitle>
                <CardDescription>
                  {payrollEnabled
                    ? `Theo tháng ${data?.month || month} (${payrollStatus || "—"})`
                    : "Chưa tạo bảng lương cho tháng này."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payrollEnabled ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gross</span>
                      <span className="font-semibold">
                        {formatVnd(data.payroll.grossPayroll)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-semibold">
                        {formatVnd(data.payroll.deductionTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net</span>
                      <span className="font-semibold">
                        {formatVnd(data.payroll.netPayroll)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePayroll}
                      >
                        Tính lại
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Nhấn “Tạo bảng lương” để hệ thống tổng hợp lương theo
                      tháng từ lương cơ bản, chấm công và nghỉ không lương
                      (UNPAID).
                    </p>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleGeneratePayroll}
                    >
                      Tạo bảng lương
                    </Button>
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

export default StaffDashboardPage;
