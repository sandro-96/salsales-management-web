import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { SHOP_ROLE, SHOP_ROLE_BADGE_VARIANT } from "../../constants/shopRoles.js";
import { getShopRoleLabel } from "@/utils/shopLabels";

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
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const emptyValue = t("pages.staffs.overview.emptyValue");
  const navigate = useNavigate();
  const { selectedShopId } = useShop();
  const shopId = selectedShopId;

  const formatVnd = useCallback(
    (value) => {
      const n = Number(value || 0);
      return `${Math.round(n).toLocaleString(numberLocale)} ₫`;
    },
    [numberLocale],
  );

  const formatMinutes = useCallback(
    (m) => {
      const n = Number(m || 0);
      if (!Number.isFinite(n) || n <= 0) {
        return t("pages.staffs.dashboard.formatMinutesZero");
      }
      const h = Math.floor(n / 60);
      const min = n % 60;
      return min === 0 ? `${h}h` : `${h}h ${min}m`;
    },
    [t],
  );

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
      toast.error(t("pages.staffs.dashboard.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, month, t]);

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
        label: getShopRoleLabel(t, value) || value,
        count: Number(data.staffByRole[value] || 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, t]);

  const branchRows = data?.staffByBranch ?? [];
  const contractEntries = useMemo(() => {
    if (!data?.payrollByContract) return [];
    return Object.entries(data.payrollByContract).map(([key, val]) => ({
      key,
      label: t(`pages.staffs.contractType.${key}`, { defaultValue: key }),
      staffCount: Number(val?.staffCount || 0),
      totalSalary: Number(val?.totalSalary || 0),
    }));
  }, [data, t]);

  const payrollEnabled = !!data?.payroll?.enabled;
  const payrollStatus = data?.payroll?.status;

  const handleGeneratePayroll = async () => {
    if (!shopId) return;
    try {
      await payrollGenerate(shopId, { month });
      toast.success(t("pages.staffs.dashboard.payrollGenerateSuccess"));
      fetchOverview();
    } catch (err) {
      console.error("Generate payroll error:", err);
      toast.error(
        err.response?.data?.message || t("pages.staffs.dashboard.payrollGenerateFail"),
      );
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
            aria-label={t("pages.staffs.dashboard.backAriaLabel")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("pages.staffs.dashboard.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pages.staffs.dashboard.subtitle")}
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
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t("pages.staffs.dashboard.loading")}
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("pages.staffs.dashboard.empty")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label={t("pages.staffs.dashboard.statTotalStaff")}
              value={data.totalStaff?.toLocaleString(numberLocale) || 0}
              hint={t("pages.staffs.dashboard.statTotalStaffHint", {
                system: data.systemStaff || 0,
                external: data.externalStaff || 0,
              })}
              accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
            />
            <StatCard
              icon={Wallet}
              label={t("pages.staffs.dashboard.statTotalSalary")}
              value={formatVnd(data.totalMonthlySalary)}
              hint={t("pages.staffs.dashboard.statTotalSalaryHint", {
                count: data.staffWithSalary || 0,
              })}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
            />
            <StatCard
              icon={Briefcase}
              label={t("pages.staffs.dashboard.statAverageSalary")}
              value={formatVnd(data.averageSalary)}
              hint={t("pages.staffs.dashboard.statAverageSalaryHint")}
              accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
            />
            <StatCard
              icon={Shield}
              label={t("pages.staffs.dashboard.statNewStaff")}
              value={data.newStaffThisMonth?.toLocaleString(numberLocale) || 0}
              hint={t("pages.staffs.dashboard.statNewStaffHint", {
                month: data.month || month,
              })}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" /> {t("pages.staffs.dashboard.byRoleTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.staffs.dashboard.byRoleDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pages.staffs.dashboard.colRole")}</TableHead>
                      <TableHead className="text-right">{t("pages.staffs.dashboard.colCount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground py-6"
                        >
                          {t("pages.staffs.dashboard.byRoleEmpty")}
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
                            {row.count.toLocaleString(numberLocale)}
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
                  <Building2 className="h-4 w-4" /> {t("pages.staffs.dashboard.byBranchTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.staffs.dashboard.byBranchDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pages.staffs.dashboard.colBranch")}</TableHead>
                      <TableHead className="text-right">{t("pages.staffs.dashboard.colCount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground py-6"
                        >
                          {t("pages.staffs.dashboard.byBranchEmpty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      branchRows.map((row, idx) => (
                        <TableRow key={row.branchId || `__unassigned__-${idx}`}>
                          <TableCell className="font-medium">
                            {row.branchName || emptyValue}
                            {!row.branchId && (
                              <Badge variant="outline" className="ml-2">
                                {t("pages.staffs.dashboard.unassignedBadge")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(row.count || 0).toLocaleString(numberLocale)}
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
                <Wallet className="h-4 w-4" /> {t("pages.staffs.dashboard.contractCostTitle")}
              </CardTitle>
              <CardDescription>
                {t("pages.staffs.dashboard.contractCostDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pages.staffs.dashboard.colContractType")}</TableHead>
                    <TableHead className="text-right">{t("pages.staffs.dashboard.colStaffCount")}</TableHead>
                    <TableHead className="text-right">{t("pages.staffs.dashboard.colTotalSalary")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-6"
                      >
                        {t("pages.staffs.dashboard.contractCostEmpty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    contractEntries.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">
                          {row.staffCount.toLocaleString(numberLocale)}
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
                <CardTitle className="text-sm">{t("pages.staffs.dashboard.attendanceTitle")}</CardTitle>
                <CardDescription>
                  {data?.attendance?.enabled
                    ? t("pages.staffs.dashboard.attendanceMonthDesc", {
                        month: data.month || month,
                      })
                    : t("pages.staffs.dashboard.attendancePreparing")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.attendance?.enabled ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.attendanceTotalSessions")}</span>
                      <span className="font-semibold">
                        {Number(data.attendance.totalShiftsScheduled || 0).toLocaleString(
                          numberLocale,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.attendanceCompletedShifts")}</span>
                      <span className="font-semibold">
                        {Number(data.attendance.totalShiftsCompleted || 0).toLocaleString(
                          numberLocale,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.attendanceTotalWorkHours")}</span>
                      <span className="font-semibold">
                        {formatMinutes(data.attendance.totalWorkMinutes)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {t("pages.staffs.dashboard.attendanceLateEarlyHint")}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("pages.staffs.dashboard.attendanceDisabledHint")}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("pages.staffs.dashboard.leaveTitle")}</CardTitle>
                <CardDescription>
                  {t("pages.staffs.dashboard.leaveMonthDesc", {
                    month: data?.month || month,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("pages.staffs.dashboard.leaveTotal")}</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.totalRequests || 0).toLocaleString(numberLocale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("pages.staffs.dashboard.leavePending")}</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.pendingRequests || 0).toLocaleString(numberLocale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("pages.staffs.dashboard.leaveApproved")}</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.approvedRequests || 0).toLocaleString(numberLocale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("pages.staffs.dashboard.leaveRejected")}</span>
                  <span className="font-semibold">
                    {Number(leaveSummary?.rejectedRequests || 0).toLocaleString(numberLocale)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">{t("pages.staffs.dashboard.payrollTitle")}</CardTitle>
                <CardDescription>
                  {payrollEnabled
                    ? t("pages.staffs.dashboard.payrollMonthActive", {
                        month: data?.month || month,
                        status: payrollStatus || t("pages.staffs.overview.emptyValue"),
                      })
                    : t("pages.staffs.dashboard.payrollNotCreated")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payrollEnabled ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.payrollGross")}</span>
                      <span className="font-semibold">
                        {formatVnd(data.payroll.grossPayroll)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.payrollDeductions")}</span>
                      <span className="font-semibold">
                        {formatVnd(data.payroll.deductionTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.dashboard.payrollNet")}</span>
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
                        {t("pages.staffs.dashboard.payrollRecalculate")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t("pages.staffs.dashboard.payrollCreateHint")}
                    </p>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleGeneratePayroll}
                    >
                      {t("pages.staffs.dashboard.payrollCreate")}
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
