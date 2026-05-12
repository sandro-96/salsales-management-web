import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  SHOP_ROLE_BADGE_VARIANT,
  SHOP_ROLE_LABELS,
} from "../../constants/shopRoles.js";
import StaffProfileModal from "./StaffProfileModal.jsx";

const CONTRACT_LABELS = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  PROBATION: "Thử việc",
  CONTRACT: "Hợp đồng",
};

const formatVnd = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value || 0);
  return `${Math.round(n).toLocaleString("vi-VN")} ₫`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatMinutes = (m) => {
  const n = Number(m || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
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

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-muted-foreground">
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-all">
        {value && String(value).trim() ? value : "—"}
      </span>
    </div>
  </div>
);

const PlaceholderCard = ({ title, phase, description }) => (
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
      <p className="text-xs text-muted-foreground">
        Dữ liệu sẽ hiển thị tại đây sau khi module được bật.
      </p>
    </CardContent>
  </Card>
);

const StaffOverviewPage = () => {
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
  const [manualCheckIn, setManualCheckIn] = useState("");
  const [manualCheckOut, setManualCheckOut] = useState("");
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
      toast.error("Không thể tải hồ sơ nhân sự.");
    } finally {
      setLoading(false);
    }
  }, [shopId, routeId]);

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
          err.response?.data?.message || "Không thể tải bảng lương nhân viên.",
        );
      }
      setPayrollItem(null);
    } finally {
      setPayrollLoading(false);
    }
  }, [shopId, data]);

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
    ? CONTRACT_LABELS[profile.contractType] || profile.contractType
    : null;

  const staffRef = profile ? (profile.external ? profile.id : profile.userId) : null;
  const staffType = profile ? (profile.external ? "EXTERNAL" : "SYSTEM") : null;

  const canManageAttendanceManual =
    shopRole === "OWNER" || shopRole === "MANAGER";

  useEffect(() => {
    if (!staffRef) return;
    const d = localYmd(new Date());
    setManualWorkDate(d);
    setManualCheckIn(`${d}T08:00`);
    setManualCheckOut(`${d}T17:00`);
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
      toast.success("Đã check-in.");
      fetchAttendance();
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error(err.response?.data?.message || "Không thể check-in.");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!shopId || !staffRef) return;
    setAttendanceSubmitting(true);
    try {
      await attendanceCheckOut(shopId, { staffRef, staffType });
      toast.success("Đã check-out.");
      fetchAttendance();
    } catch (err) {
      console.error("Check-out error:", err);
      toast.error(err.response?.data?.message || "Không thể check-out.");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleManualAttendanceSave = async () => {
    if (!shopId || !staffRef || !staffType) return;
    if (!manualWorkDate || !manualCheckIn) {
      toast.error("Vui lòng chọn ngày làm việc và giờ vào.");
      return;
    }
    setManualSubmitting(true);
    try {
      const payload = {
        staffRef,
        staffType,
        workDate: manualWorkDate,
        checkInAt: normalizeDatetimeLocal(manualCheckIn),
        replaceDay: manualReplaceDay,
      };
      const co = normalizeDatetimeLocal(manualCheckOut);
      if (co) payload.checkOutAt = co;
      if (manualNote.trim()) payload.note = manualNote.trim();

      await attendanceManualSession(shopId, payload);
      toast.success("Đã lưu giờ chấm công.");
      fetchAttendance();
    } catch (err) {
      console.error("Manual attendance error:", err);
      toast.error(
        err.response?.data?.message || "Không thể lưu giờ chấm công.",
      );
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleCreateLeave = async () => {
    if (!shopId || !staffRef) return;
    if (!leaveForm.fromDate || !leaveForm.toDate) {
      toast.error("Vui lòng chọn từ ngày / đến ngày.");
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
      toast.success("Đã tạo đơn nghỉ phép.");
      setLeaveCreateOpen(false);
      setLeaveForm((s) => ({ ...s, reason: "" }));
      fetchLeaves();
    } catch (err) {
      console.error("Create leave error:", err);
      toast.error(err.response?.data?.message || "Không thể tạo đơn nghỉ phép.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await approveLeaveRequest(shopId, leaveId);
      toast.success("Đã duyệt đơn.");
      fetchLeaves();
    } catch (err) {
      console.error("Approve leave error:", err);
      toast.error(err.response?.data?.message || "Không thể duyệt đơn.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await rejectLeaveRequest(shopId, leaveId, {});
      toast.success("Đã từ chối đơn.");
      fetchLeaves();
    } catch (err) {
      console.error("Reject leave error:", err);
      toast.error(err.response?.data?.message || "Không thể từ chối đơn.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!shopId || !leaveId) return;
    setLeaveSubmitting(true);
    try {
      await cancelLeaveRequest(shopId, leaveId, {});
      toast.success("Đã huỷ đơn.");
      fetchLeaves();
    } catch (err) {
      console.error("Cancel leave error:", err);
      toast.error(err.response?.data?.message || "Không thể huỷ đơn.");
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
          aria-label="Về danh sách nhân sự"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Hồ sơ nhân sự
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Thông tin chi tiết, vai trò, lương và placeholder cho chấm công /
            nghỉ phép / bảng lương.
          </p>
        </div>
        {profile && (
          <Button
            variant="success"
            onClick={() => setEditOpen(true)}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Chỉnh sửa hồ sơ</span>
          </Button>
        )}
      </div>

      {loading && !profile ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải...
        </div>
      ) : !profile ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Không tìm thấy nhân sự.
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
                        {profile.fullName || "—"}
                      </h3>
                      {isExternal ? (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" /> Ngoài hệ thống
                        </Badge>
                      ) : (
                        <Badge
                          variant={SHOP_ROLE_BADGE_VARIANT[role] || "outline"}
                          className="gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {SHOP_ROLE_LABELS[role] || role || "—"}
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
                      {profile.email || "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Chi nhánh
                    </div>
                    <div className="text-sm font-medium">
                      {branchName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Lương</div>
                    <div className="text-sm font-medium">
                      {profile.salary ? formatVnd(profile.salary) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Loại HĐ
                    </div>
                    <div className="text-sm font-medium">
                      {contractLabel || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liên hệ</CardTitle>
                <CardDescription>
                  Thông tin liên lạc của nhân sự.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <InfoRow icon={Phone} label="Số điện thoại" value={profile.phone} />
                <InfoRow
                  icon={MapPin}
                  label="Chi nhánh"
                  value={branchName}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Phòng ban"
                  value={profile.department}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Cấp bậc"
                  value={profile.level}
                />
                <InfoRow
                  icon={CalendarDays}
                  label="Ngày vào làm"
                  value={profile.startDate ? formatDate(profile.startDate) : null}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hợp đồng & lương</CardTitle>
                <CardDescription>
                  Lương cố định khai báo. Lương thực trả hiển thị khi bật phase
                  Payroll.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Wallet}
                  label="Lương cố định / tháng"
                  value={formatVnd(profile.salary)}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Loại hợp đồng"
                  value={contractLabel}
                />
                <InfoRow
                  icon={IdCard}
                  label="Số CCCD"
                  value={profile.idNumber}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Ngân hàng"
                  value={profile.bankName}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Số tài khoản"
                  value={profile.bankAccountNumber}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Chủ tài khoản"
                  value={profile.bankAccountHolder}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liên hệ khẩn cấp</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={Users}
                label="Người liên hệ"
                value={profile.emergencyContactName}
              />
              <InfoRow
                icon={Phone}
                label="Số điện thoại"
                value={profile.emergencyContactPhone}
              />
              {profile.note ? (
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Ghi chú
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {profile.note}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Chấm công (Phase 2)
                </CardTitle>
                <CardDescription>
                  Check-in / check-out theo ca (nhiều lượt trong ngày) và tự cộng tổng giờ.
                  {canManageAttendanceManual ? (
                    <>
                      {" "}
                      Owner/Manager có thể nhập giờ vào — giờ ra theo ngày (khi nhân viên không
                      tiện mở app).
                    </>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attendanceLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải chấm công...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">
                          Hôm nay
                        </div>
                        <div className="font-medium">
                          {todayEntry?.checkInAt ? "Đã check-in" : "Chưa check-in"}
                          {todayEntry?.checkOutAt ? " · Đã check-out" : ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Tổng giờ hôm nay:{" "}
                          <span className="font-medium text-foreground">
                            {formatMinutes(todayEntry?.totalMinutes)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={attendanceSubmitting || hasOpenSession}
                          onClick={handleCheckIn}
                        >
                          <LogIn className="h-4 w-4" /> Check-in
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
                          <LogOut className="h-4 w-4" /> Check-out
                        </Button>
                      </div>
                    </div>

                    {canManageAttendanceManual ? (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                        <div className="text-sm font-medium">
                          Nhập giờ chấm công (quản lý)
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dùng khi nhân viên không thể bấm check-in/check-out trên app. Có thể chọn
                          ngày trong quá khứ và chỉnh sửa theo thực tế ca làm.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="manual-work-date" className="text-xs">
                              Ngày làm việc
                            </Label>
                            <Input
                              id="manual-work-date"
                              type="date"
                              value={manualWorkDate}
                              onChange={(e) => setManualWorkDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2 grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="manual-in" className="text-xs">
                                Giờ vào
                              </Label>
                              <Input
                                id="manual-in"
                                type="datetime-local"
                                value={manualCheckIn}
                                onChange={(e) => setManualCheckIn(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="manual-out" className="text-xs">
                                Giờ ra (tuỳ chọn)
                              </Label>
                              <Input
                                id="manual-out"
                                type="datetime-local"
                                value={manualCheckOut}
                                onChange={(e) => setManualCheckOut(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="manual-note" className="text-xs">
                            Ghi chú (tuỳ chọn)
                          </Label>
                          <Textarea
                            id="manual-note"
                            rows={2}
                            className="text-sm resize-none"
                            value={manualNote}
                            onChange={(e) => setManualNote(e.target.value)}
                            placeholder="VD: ca sáng cửa hàng, bù giờ..."
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
                            Ghi đè toàn bộ ca trong ngày đã chọn (xóa các session chấm công trước
                            đó trong ngày đó).
                          </Label>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={manualSubmitting || !manualWorkDate || !manualCheckIn}
                          onClick={handleManualAttendanceSave}
                        >
                          {manualSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Đang lưu...
                            </>
                          ) : (
                            "Lưu giờ chấm công"
                          )}
                        </Button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Ngày có check-in
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.checkedInDays ?? 0}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Ngày có check-out
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.checkedOutDays ?? 0}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-[11px] text-muted-foreground">
                          Bản ghi
                        </div>
                        <div className="text-sm font-semibold">
                          {attendanceMonth?.totalDays ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-2">
                        Timeline hôm nay
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
                                  Ca {idx + 1}
                                </Badge>
                                <div className="truncate">
                                  {formatTime(s.checkInAt)} →{" "}
                                  {formatTime(s.checkOutAt)}
                                </div>
                              </div>
                              <div className="text-muted-foreground shrink-0">
                                {formatMinutes(s.minutes)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Chưa có session nào hôm nay.
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-3 mb-2">
                        Gần đây
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
                                {formatMinutes(e.totalMinutes)}
                              </div>
                            </div>
                          ))}
                        {(!attendanceMonth?.entries ||
                          attendanceMonth.entries.length === 0) && (
                          <div className="text-sm text-muted-foreground">
                            Chưa có bản ghi chấm công.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Nghỉ phép</CardTitle>
                  <CardDescription>
                    Tạo đơn nghỉ phép, theo dõi trạng thái và duyệt/từ chối theo quyền.
                  </CardDescription>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setLeaveCreateOpen(true)}
                >
                  Tạo đơn
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaveLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải đơn nghỉ phép...
                  </div>
                ) : leaveList.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Chưa có đơn nghỉ phép trong tháng này.
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
                          className="rounded-md border p-2 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
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
                          <div className="flex items-center gap-2 shrink-0">
                            {(lr.status === "PENDING" ||
                              lr.status === "APPROVED") && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={leaveSubmitting}
                                onClick={() => handleCancelLeave(lr.id)}
                              >
                                Huỷ
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
                                  Duyệt
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={leaveSubmitting}
                                  onClick={() => handleRejectLeave(lr.id)}
                                >
                                  Từ chối
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bảng lương</CardTitle>
                <CardDescription>
                  Theo tháng {data?.month || "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {payrollLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải bảng lương...
                  </div>
                ) : !payrollItem ? (
                  <div className="text-sm text-muted-foreground">
                    Chưa có bảng lương cho tháng này. Vào “Tổng quan nhân sự” →
                    “Bảng lương” để tạo.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.baseSalary)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gross</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.grossSalary)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.deduction)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net</span>
                      <span className="font-semibold">
                        {formatVnd(payrollItem.netSalary)}
                      </span>
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                      <div>
                        Chấm công:{" "}
                        <span className="font-medium text-foreground">
                          {formatMinutes(payrollItem.workMinutes)}
                        </span>
                      </div>
                      <div>
                        Nghỉ đã duyệt:{" "}
                        <span className="font-medium text-foreground">
                          {Number(payrollItem.approvedLeaveDays || 0)} ngày
                        </span>
                        {" · "}
                        UNPAID:{" "}
                        <span className="font-medium text-foreground">
                          {Number(payrollItem.unpaidLeaveDays || 0)} ngày
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={leaveCreateOpen} onOpenChange={setLeaveCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo đơn nghỉ phép</DialogTitle>
                <DialogDescription>
                  Nhập khoảng thời gian nghỉ và lý do. Đơn sẽ ở trạng thái chờ
                  duyệt.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Loại nghỉ</Label>
                  <Input
                    value={leaveForm.type}
                    onChange={(e) =>
                      setLeaveForm((s) => ({ ...s, type: e.target.value }))
                    }
                    placeholder="ANNUAL / SICK / UNPAID..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Từ ngày</Label>
                    <Input
                      type="date"
                      value={leaveForm.fromDate}
                      onChange={(e) =>
                        setLeaveForm((s) => ({ ...s, fromDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Đến ngày</Label>
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
                  <Label>Lý do</Label>
                  <Textarea
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm((s) => ({ ...s, reason: e.target.value }))
                    }
                    placeholder="VD: nghỉ ốm, việc gia đình..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setLeaveCreateOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  variant="success"
                  disabled={leaveSubmitting}
                  onClick={handleCreateLeave}
                >
                  Tạo đơn
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Ngày tạo</div>
                <div>{formatDate(profile.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Cập nhật cuối
                </div>
                <div>{formatDate(profile.updatedAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">User ID</div>
                <div className="font-mono text-xs break-all">
                  {profile.userId || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Profile ID</div>
                <div className="font-mono text-xs break-all">
                  {profile.id || "—"}
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
