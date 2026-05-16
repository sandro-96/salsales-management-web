import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  Edit3,
  IdCard,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { useShop } from "../../hooks/useShop.js";
import { getStaffMemberOverview } from "../../api/staffProfileApi.js";
import {
  attendanceCheckIn,
  attendanceCheckOut,
  attendanceManualSession,
  attendanceStaffMonthSummary,
} from "../../api/attendanceApi.js";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  listLeaveRequestsForStaff,
  rejectLeaveRequest,
} from "../../api/leaveApi.js";
import { payrollGetStaffMonth } from "../../api/payrollApi.js";
import { SHOP_ROLE_BADGE_VARIANT } from "../../constants/shopRoles.js";
import { getShopRoleLabel } from "@/utils/shopLabels";
import StaffProfileModal from "./StaffProfileModal.jsx";

const formatVnd = (value, locale, emptyValue = "—") => {
  if (value === null || value === undefined || value === "") return emptyValue;
  const n = Number(value || 0);
  return `${Math.round(n).toLocaleString(locale)} ₫`;
};

const formatDate = (dateStr, locale, emptyValue = "—") => {
  if (!dateStr) return emptyValue;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return emptyValue;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr, locale, emptyValue = "—") => {
  if (!dateStr) return emptyValue;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return emptyValue;
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

const formatMinutes = (m, emptyValue = "—") => {
  const n = Number(m || 0);
  if (!Number.isFinite(n) || n <= 0) return emptyValue;
  const h = Math.floor(n / 60);
  const min = n % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

const localYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizeDatetimeLocal = (v) => {
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 16 ? `${t}:00` : t;
};

/** Ghép ngày làm việc (YYYY-MM-DD) với giờ (HH:mm) cho API chấm công thủ công. */
const combineWorkDateTime = (workDate, timeStr) => {
  if (!workDate?.trim() || !timeStr?.trim()) return null;
  return `${workDate.trim()}T${timeStr.trim()}`;
};

const InfoRow = ({ icon: Icon, label, value, emptyValue = "—" }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-muted-foreground">
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-all">
        {value && String(value).trim() ? value : emptyValue}
      </span>
    </div>
  </div>
);

const PlaceholderCard = ({ title, phase, description, hint }) => (
  <Card className="border-dashed">
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        {title}
        <Badge variant="outline" className="text-[10px]">
          {phase}
        </Badge>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
);

const StaffOverviewPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const emptyValue = t("pages.staffs.overview.emptyValue");
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { selectedShopId, branches, shopRole } = useShop();
  const shopId = selectedShopId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [manualWorkDate, setManualWorkDate] = useState("");
  const [manualCheckInTime, setManualCheckInTime] = useState("");
  const [manualCheckOutTime, setManualCheckOutTime] = useState("");
  const [manualReplaceDay, setManualReplaceDay] = useState(true);
  const [manualNote, setManualNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const [leaveList, setLeaveList] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveCreateOpen, setLeaveCreateOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "ANNUAL",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [payrollItem, setPayrollItem] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const branchMap = useMemo(
    () => Object.fromEntries((branches || []).map((b) => [b.id, b.name])),
    [branches],
  );

  const fetchOverview = useCallback(async () => {
    if (!shopId || !routeId) return;
    setLoading(true);
    try {
      const res = await getStaffMemberOverview(shopId, routeId);
      setData(res.data?.data ?? null);
    } catch (err) {
      console.error("Fetch staff member overview error:", err);
      toast.error(t("pages.staffs.overview.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, routeId, t]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const fetchAttendance = useCallback(async () => {
    if (!shopId) return;
    if (!data?.profile) return;
    const p = data.profile;
    const staffRef = p.external ? p.id : p.userId;
    if (!staffRef) return;

    setAttendanceLoading(true);
    try {
      const res = await attendanceStaffMonthSummary(shopId, staffRef, {
        staffType: p.external ? "EXTERNAL" : "SYSTEM",
        month: data.month,
      });
      setAttendanceMonth(res.data?.data ?? null);
    } catch (err) {
      console.error("Fetch attendance summary error:", err);
      setAttendanceMonth(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, [shopId, data]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const fetchLeaves = useCallback(async () => {
    if (!shopId || !data?.profile) return;
    const p = data.profile;
    const ref = p.external ? p.id : p.userId;
    if (!ref) return;
    setLeaveLoading(true);
    try {
      const res = await listLeaveRequestsForStaff(shopId, ref, {
        staffType: p.external ? "EXTERNAL" : "SYSTEM",
        month: data.month,
      });
      setLeaveList(res.data?.data ?? []);
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setLeaveList([]);
    } finally {
      setLeaveLoading(false);
    }
  }, [shopId, data]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const fetchPayroll = useCallback(async () => {
    if (!shopId || !data?.profile) return;
    const p = data.profile;
    const ref = p.external ? p.id : p.userId;
    if (!ref) return;
    setPayrollLoading(true);
    try {
      const res = await payrollGetStaffMonth(shopId, ref, { month: data.month });
      setPayrollItem(res.data?.data ?? null);
    } catch (err) {
      const status = err.response?.status;
      // Chưa tạo bảng lương tháng này → 404, coi như chưa có dòng lương.
      if (status && status !== 404) {
        console.error("Fetch payroll item error:", err);
        toast.error(
          err.response?.data?.message || t("pages.staffs.overview.payrollFetchError"),
        );
      }
      setPayrollItem(null);
    } finally {
      setPayrollLoading(false);
    }
  }, [shopId, data, t]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const profile = data?.profile;
  const role = profile?.role;
  const isExternal = profile?.external === true;
  const branchName = profile?.branchId
    ? branchMap[profile.branchId] || profile.branchId
    : null;
  const contractLabel = profile?.contractType
    ? t(`pages.staffs.contractType.${profile.contractType}`, {
        defaultValue: profile.contractType,
      })
    : null;

  const staffRef = profile ? (profile.external ? profile.id : profile.userId) : null;
  const staffType = profile ? (profile.external ? "EXTERNAL" : "SYSTEM") : null;

  const canManageAttendanceManual =
    shopRole === "OWNER" || shopRole === "MANAGER";

  useEffect(() => {
    if (!staffRef) return;
    const d = localYmd(new Date());
    setManualWorkDate(d);
    setManualCheckInTime("08:00");
    setManualCheckOutTime("17:00");
    setManualReplaceDay(true);
    setManualNote("");
  }, [staffRef]);

  const todayEntry = useMemo(() => {
    const entries = attendanceMonth?.entries;
    if (!Array.isArray(entries)) return null;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(today.getDate()).padStart(2, "0")}`;
    return entries.find((e) => e?.workDate === key) || null;
  }, [attendanceMonth]);

  const hasOpenSession = useMemo(() => {
    if (!todayEntry) return false;
    const sessions = todayEntry.sessions;
    if (Array.isArray(sessions) && sessions.length > 0) {
      const last = sessions[sessions.length - 1];
      return !!last?.checkInAt && !last?.checkOutAt;
    }
    // Fallback legacy
    return !!todayEntry.checkInAt && !todayEntry.checkOutAt;
  }, [todayEntry]);

  const handleCheckIn = async () => {
    if (!shopId || !staffRef) return;
    setAttendanceSubmitting(true);
    try {
      await attendanceCheckIn(shopId, { staffRef, staffType });
      toast.success(t("pages.staffs.overview.checkInSuccess"));
      fetchAttendance();
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.checkInFail"));
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!shopId || !staffRef) return;
    setAttendanceSubmitting(true);
    try {
      await attendanceCheckOut(shopId, { staffRef, staffType });
      toast.success(t("pages.staffs.overview.checkOutSuccess"));
      fetchAttendance();
    } catch (err) {
      console.error("Check-out error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.checkOutFail"));
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleManualAttendanceSave = async () => {
    if (!shopId || !staffRef || !staffType) return;
    if (!manualWorkDate || !manualCheckInTime) {
      toast.error(t("pages.staffs.overview.manualDateRequired"));
      return;
    }
    const checkInAt = combineWorkDateTime(manualWorkDate, manualCheckInTime);
    setManualSubmitting(true);
    try {
      const payload = {
        staffRef,
        staffType,
        workDate: manualWorkDate,
        checkInAt: normalizeDatetimeLocal(checkInAt),
        replaceDay: manualReplaceDay,
      };
      const co = normalizeDatetimeLocal(
        combineWorkDateTime(manualWorkDate, manualCheckOutTime),
      );
      if (co) payload.checkOutAt = co;
      if (manualNote.trim()) payload.note = manualNote.trim();

      await attendanceManualSession(shopId, payload);
      toast.success(t("pages.staffs.overview.manualSaveSuccess"));
      fetchAttendance();
    } catch (err) {
      console.error("Manual attendance error:", err);
      toast.error(
        err.response?.data?.message || t("pages.staffs.overview.manualSaveFail"),
      );
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleCreateLeave = async () => {
    if (!shopId || !staffRef) return;
    if (!leaveForm.fromDate || !leaveForm.toDate) {
      toast.error(t("pages.staffs.overview.leaveDateRequired"));
      return;
    }
    setLeaveSubmitting(true);
    try {
      await createLeaveRequest(shopId, {
        staffRef,
        staffType,
        branchId: profile?.branchId || undefined,
        type: leaveForm.type,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason,
      });
      toast.success(t("pages.staffs.overview.leaveCreateSuccess"));
      setLeaveCreateOpen(false);
      setLeaveForm((s) => ({ ...s, reason: "" }));
      fetchLeaves();
    } catch (err) {
      console.error("Create leave error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.leaveCreateFail"));
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await approveLeaveRequest(shopId, leaveId);
      toast.success(t("pages.staffs.overview.leaveApproveSuccess"));
      fetchLeaves();
    } catch (err) {
      console.error("Approve leave error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.leaveApproveFail"));
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await rejectLeaveRequest(shopId, leaveId, {});
      toast.success(t("pages.staffs.overview.leaveRejectSuccess"));
      fetchLeaves();
    } catch (err) {
      console.error("Reject leave error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.leaveRejectFail"));
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await cancelLeaveRequest(shopId, leaveId, {});
      toast.success(t("pages.staffs.overview.leaveCancelSuccess"));
      fetchLeaves();
    } catch (err) {
      console.error("Cancel leave error:", err);
      toast.error(err.response?.data?.message || t("pages.staffs.overview.leaveCancelFail"));
    } finally {
      setLeaveSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/staffs")}
          aria-label={t("pages.staffs.overview.backAriaLabel")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("pages.staffs.overview.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pages.staffs.overview.subtitle")}
          </p>
        </div>
        {profile && (
          <Button
            variant="success"
            onClick={() => setEditOpen(true)}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pages.staffs.overview.editProfile")}</span>
          </Button>
        )}
      </div>

      {loading && !profile ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t("pages.staffs.overview.loading")}
        </div>
      ) : !profile ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("pages.staffs.overview.notFound")}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
                      {(profile.fullName || profile.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold truncate">
                        {profile.fullName || emptyValue}
                      </h3>
                      {isExternal ? (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" /> {t("pages.staffs.overview.externalBadge")}
                        </Badge>
                      ) : (
                        <Badge
                          variant={SHOP_ROLE_BADGE_VARIANT[role] || "outline"}
                          className="gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {getShopRoleLabel(t, role) || role || emptyValue}
                        </Badge>
                      )}
                      {profile.position ? (
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {profile.position}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {profile.email || emptyValue}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("pages.staffs.overview.summaryBranch")}
                    </div>
                    <div className="text-sm font-medium">
                      {branchName || emptyValue}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("pages.staffs.overview.summarySalary")}</div>
                    <div className="text-sm font-medium">
                      {profile.salary ? formatVnd(profile.salary, numberLocale, emptyValue) : emptyValue}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {t("pages.staffs.overview.summaryContract")}
                    </div>
                    <div className="text-sm font-medium">
                      {contractLabel || emptyValue}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("pages.staffs.overview.contactTitle")}</CardTitle>
                <CardDescription>
                  {t("pages.staffs.overview.contactDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Mail} label={t("pages.staffs.overview.labelEmail")} value={profile.email} emptyValue={emptyValue} />
                  <InfoRow icon={Phone} label={t("pages.staffs.overview.labelPhone")} value={profile.phone} emptyValue={emptyValue} />
                  <InfoRow
                    icon={MapPin}
                    label={t("pages.staffs.overview.labelBranch")}
                    value={branchName}
                    emptyValue={emptyValue}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label={t("pages.staffs.overview.labelDepartment")}
                    value={profile.department}
                    emptyValue={emptyValue}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label={t("pages.staffs.overview.labelLevel")}
                    value={profile.level}
                    emptyValue={emptyValue}
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label={t("pages.staffs.overview.labelStartDate")}
                    value={profile.startDate ? formatDate(profile.startDate, numberLocale, emptyValue) : null}
                    emptyValue={emptyValue}
                  />
                </div>
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">
                    {t("pages.staffs.overview.emergencyTitle")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={Users}
                      label={t("pages.staffs.overview.labelEmergencyContact")}
                      value={profile.emergencyContactName}
                      emptyValue={emptyValue}
                    />
                    <InfoRow
                      icon={Phone}
                      label={t("pages.staffs.overview.labelPhone")}
                      value={profile.emergencyContactPhone}
                      emptyValue={emptyValue}
                    />
                  </div>
                  {profile.note ? (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {t("pages.staffs.overview.labelNote")}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{profile.note}</div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("pages.staffs.overview.contractSalaryTitle")}</CardTitle>
                <CardDescription>
                  {t("pages.staffs.overview.contractSalaryDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Wallet}
                  label={t("pages.staffs.overview.labelFixedSalary")}
                  value={formatVnd(profile.salary, numberLocale, emptyValue)}
                  emptyValue={emptyValue}
                />
                <InfoRow
                  icon={Briefcase}
                  label={t("pages.staffs.overview.labelContractType")}
                  value={contractLabel}
                  emptyValue={emptyValue}
                />
                <InfoRow
                  icon={IdCard}
                  label={t("pages.staffs.overview.labelIdNumber")}
                  value={profile.idNumber}
                  emptyValue={emptyValue}
                />
                <InfoRow
                  icon={CreditCard}
                  label={t("pages.staffs.overview.labelBank")}
                  value={profile.bankName}
                  emptyValue={emptyValue}
                />
                <InfoRow
                  icon={CreditCard}
                  label={t("pages.staffs.overview.labelBankAccount")}
                  value={profile.bankAccountNumber}
                  emptyValue={emptyValue}
                />
                <InfoRow
                  icon={CreditCard}
                  label={t("pages.staffs.overview.labelBankHolder")}
                  value={profile.bankAccountHolder}
                  emptyValue={emptyValue}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" /> {t("pages.staffs.overview.attendanceTitle")}
                </CardTitle>
                <CardDescription>
                  {t("pages.staffs.overview.attendanceDesc")}
                  {canManageAttendanceManual ? (
                    <> {" "}{t("pages.staffs.overview.attendanceDescManual")}</>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attendanceLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("pages.staffs.overview.attendanceLoading")}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="text-sm min-w-0">
                        <div className="text-muted-foreground text-xs">
                          {t("pages.staffs.overview.today")}
                        </div>
                        <div className="font-medium">
                          {todayEntry?.checkInAt ? t("pages.staffs.overview.checkedIn") : t("pages.staffs.overview.notCheckedIn")}
                          {todayEntry?.checkOutAt ? t("pages.staffs.overview.checkedOutSuffix") : ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("pages.staffs.overview.todayTotalHours")}{" "}
                          <span className="font-medium text-foreground">
                            {formatMinutes(todayEntry?.totalMinutes, emptyValue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={attendanceSubmitting || hasOpenSession}
                          onClick={handleCheckIn}
                        >
                          <LogIn className="h-4 w-4 shrink-0" /> {t("pages.staffs.overview.checkIn")}
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          className="gap-2"
                          disabled={
                            attendanceSubmitting ||
                            !hasOpenSession
                          }
                          onClick={handleCheckOut}
                        >
                          <LogOut className="h-4 w-4 shrink-0" /> {t("pages.staffs.overview.checkOut")}
                        </Button>
                      </div>
                    </div>

                    {canManageAttendanceManual ? (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                        <div className="text-sm font-medium">
                          {t("pages.staffs.overview.manualTitle")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("pages.staffs.overview.manualHint")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="manual-work-date" className="text-xs">
                              {t("pages.staffs.overview.manualWorkDate")}
                            </Label>
                            <Input
                              id="manual-work-date"
                              type="date"
                              value={manualWorkDate}
                              onChange={(e) => setManualWorkDate(e.target.value)}
                              className="w-full min-w-0"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="manual-in" className="text-xs">
                              {t("pages.staffs.overview.manualCheckIn")}
                            </Label>
                            <Input
                              id="manual-in"
                              type="time"
                              value={manualCheckInTime}
                              onChange={(e) => setManualCheckInTime(e.target.value)}
                              className="w-full min-w-0"
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                            <Label htmlFor="manual-out" className="text-xs">
                              {t("pages.staffs.overview.manualCheckOut")}
                            </Label>
                            <Input
                              id="manual-out"
                              type="time"
                              value={manualCheckOutTime}
                              onChange={(e) => setManualCheckOutTime(e.target.value)}
                              className="w-full min-w-0"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="manual-note" className="text-xs">
                            {t("pages.staffs.overview.manualNote")}
                          </Label>
                          <Textarea
                            id="manual-note"
                            rows={2}
                            className="text-sm resize-none"
                            value={manualNote}
                            onChange={(e) => setManualNote(e.target.value)}
                            placeholder={t("pages.staffs.overview.manualNotePlaceholder")}
                          />
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="manual-replace"
                            checked={manualReplaceDay}
                            onCheckedChange={(v) => setManualReplaceDay(v === true)}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor="manual-replace"
                            className="text-xs font-normal leading-snug cursor-pointer"
                          >
                            {t("pages.staffs.overview.manualReplaceDay")}
                          </Label>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            manualSubmitting || !manualWorkDate || !manualCheckInTime
                          }
                          onClick={handleManualAttendanceSave}
                        >
                          {manualSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              {t("pages.staffs.overview.manualSaving")}
                            </>
                          ) : (
                            t("pages.staffs.overview.manualSave")
                          )}
                        </Button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          {t("pages.staffs.overview.statCheckedInDays")}
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.checkedInDays ?? 0}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          {t("pages.staffs.overview.statCheckedOutDays")}
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.checkedOutDays ?? 0}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          {t("pages.staffs.overview.statRecords")}
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.totalDays ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {t("pages.staffs.overview.timelineToday")}
                        </div>
                      {todayEntry?.sessions?.length ? (
                        <div className="space-y-2">
                          {todayEntry.sessions.map((s, idx) => (
                            <div
                              key={`${todayEntry.workDate}-${idx}`}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="shrink-0">
                                  {t("pages.staffs.overview.shiftBadge", { index: idx + 1 })}
                                </Badge>
                                <div className="truncate">
                                  {formatTime(s.checkInAt, numberLocale, emptyValue)} →{" "}
                                  {formatTime(s.checkOutAt, numberLocale, emptyValue)}
                                </div>
                              </div>
                              <div className="text-muted-foreground shrink-0">
                                {formatMinutes(s.minutes, emptyValue)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {t("pages.staffs.overview.noSessionsToday")}
                        </div>
                      )}
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {t("pages.staffs.overview.recent")}
                        </div>
                        <div className="space-y-2">
                        {(attendanceMonth?.entries || [])
                          .slice()
                          .sort((a, b) =>
                            String(b?.workDate || "").localeCompare(
                              String(a?.workDate || ""),
                            ),
                          )
                          .slice(0, 3)
                          .map((e) => (
                            <div
                              key={e.id || e.workDate}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="font-medium">{e.workDate}</div>
                              <div className="text-muted-foreground">
                                {formatMinutes(e.totalMinutes, emptyValue)}
                              </div>
                            </div>
                          ))}
                        {(!attendanceMonth?.entries ||
                          attendanceMonth.entries.length === 0) && (
                          <div className="text-sm text-muted-foreground">
                            {t("pages.staffs.overview.noAttendanceRecords")}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start">
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-sm">{t("pages.staffs.overview.leaveTitle")}</CardTitle>
                  <CardDescription>
                    {t("pages.staffs.overview.leaveDesc")}
                  </CardDescription>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                  onClick={() => setLeaveCreateOpen(true)}
                >
                  {t("pages.staffs.overview.createLeave")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaveLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("pages.staffs.overview.leaveLoading")}
                  </div>
                ) : leaveList.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("pages.staffs.overview.leaveEmpty")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaveList
                      .slice()
                      .sort((a, b) =>
                        String(b?.fromDate || "").localeCompare(
                          String(a?.fromDate || ""),
                        ),
                      )
                      .slice(0, 4)
                      .map((lr) => (
                        <div
                          key={lr.id}
                          className="rounded-md border p-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">{lr.type || "ANNUAL"}</Badge>
                              <Badge
                                variant={
                                  lr.status === "APPROVED"
                                    ? "success"
                                    : lr.status === "REJECTED"
                                      ? "destructive"
                                      : lr.status === "CANCELLED"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {lr.status}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium mt-1">
                              {lr.fromDate} → {lr.toDate}
                            </div>
                            {lr.reason ? (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {lr.reason}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {(lr.status === "PENDING" ||
                              lr.status === "APPROVED") && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={leaveSubmitting}
                                onClick={() => handleCancelLeave(lr.id)}
                              >
                                {t("pages.staffs.overview.leaveCancel")}
                              </Button>
                            )}
                            {lr.status === "PENDING" && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  disabled={leaveSubmitting}
                                  onClick={() => handleApproveLeave(lr.id)}
                                >
                                  {t("pages.staffs.overview.leaveApprove")}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={leaveSubmitting}
                                  onClick={() => handleRejectLeave(lr.id)}
                                >
                                  {t("pages.staffs.overview.leaveReject")}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-sm">{t("pages.staffs.overview.payrollTitle")}</CardTitle>
                <CardDescription>
                  {t("pages.staffs.overview.payrollMonthDesc", { month: data?.month || emptyValue })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {payrollLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("pages.staffs.overview.payrollLoading")}
                  </div>
                ) : !payrollItem ? (
                  <div className="text-sm text-muted-foreground">
                    {t("pages.staffs.overview.payrollEmpty")}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.overview.payrollBase")}</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.baseSalary, numberLocale, emptyValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.overview.payrollGross")}</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.grossSalary, numberLocale, emptyValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.overview.payrollDeductions")}</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.deduction, numberLocale, emptyValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("pages.staffs.overview.payrollNet")}</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.netSalary, numberLocale, emptyValue)}
                      </span>
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                      <div>
                        {t("pages.staffs.overview.payrollAttendance")}{" "}
                        <span className="font-medium text-foreground">
                          {formatMinutes(payrollItem.workMinutes, emptyValue)}
                        </span>
                      </div>
                      <div>
                        {t("pages.staffs.overview.payrollApprovedLeave")}{" "}
                        <span className="font-medium text-foreground">
                          {t("pages.staffs.overview.payrollApprovedLeaveDays", {
                            count: Number(payrollItem.approvedLeaveDays || 0),
                          })}
                        </span>
                        {" · "}
                        {t("pages.staffs.overview.payrollUnpaid")}{" "}
                        <span className="font-medium text-foreground">
                          {t("pages.staffs.overview.payrollUnpaidDays", {
                            count: Number(payrollItem.unpaidLeaveDays || 0),
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            </div>
          </div>

          <Dialog open={leaveCreateOpen} onOpenChange={setLeaveCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("pages.staffs.overview.leaveCreateTitle")}</DialogTitle>
                <DialogDescription>
                  {t("pages.staffs.overview.leaveCreateDesc")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>{t("pages.staffs.overview.leaveTypeLabel")}</Label>
                  <Input
                    value={leaveForm.type}
                    onChange={(e) =>
                      setLeaveForm((s) => ({ ...s, type: e.target.value }))
                    }
                    placeholder={t("pages.staffs.overview.leaveTypePlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>{t("pages.staffs.overview.leaveFromDate")}</Label>
                    <Input
                      type="date"
                      value={leaveForm.fromDate}
                      onChange={(e) =>
                        setLeaveForm((s) => ({ ...s, fromDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("pages.staffs.overview.leaveToDate")}</Label>
                    <Input
                      type="date"
                      value={leaveForm.toDate}
                      onChange={(e) =>
                        setLeaveForm((s) => ({ ...s, toDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t("pages.staffs.overview.leaveReason")}</Label>
                  <Textarea
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm((s) => ({ ...s, reason: e.target.value }))
                    }
                    placeholder={t("pages.staffs.overview.leaveReasonPlaceholder")}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setLeaveCreateOpen(false)}
                >
                  {t("pages.staffs.overview.leaveClose")}
                </Button>
                <Button
                  variant="success"
                  disabled={leaveSubmitting}
                  onClick={handleCreateLeave}
                >
                  {t("pages.staffs.overview.leaveCreateSubmit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {t("pages.staffs.overview.metadataTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">{t("pages.staffs.overview.metadataCreatedAt")}</div>
                <div>{formatDate(profile.createdAt, numberLocale, emptyValue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("pages.staffs.overview.metadataUpdatedAt")}
                </div>
                <div>{formatDate(profile.updatedAt, numberLocale, emptyValue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("pages.staffs.overview.metadataUserId")}</div>
                <div className="font-mono text-xs break-all">
                  {profile.userId || emptyValue}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("pages.staffs.overview.metadataProfileId")}</div>
                <div className="font-mono text-xs break-all">
                  {profile.id || emptyValue}
                </div>
              </div>
            </CardContent>
          </Card>

          <StaffProfileModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            staff={profile}
            shopId={shopId}
            onSuccess={fetchOverview}
          />
        </>
      )}
    </div>
  );
};

export default StaffOverviewPage;
