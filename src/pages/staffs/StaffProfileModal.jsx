import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  getStaffProfile,
  saveStaffProfile,
  getExternalProfile,
  updateExternalProfile,
  createExternalStaff,
} from "../../api/staffProfileApi.js";
import { useShop } from "../../hooks/useShop.js";
import { SHOP_ROLE_LABELS } from "../../constants/shopRoles.js";

const CONTRACT_TYPES = [
  { value: "FULL_TIME", label: "Toàn thời gian" },
  { value: "PART_TIME", label: "Bán thời gian" },
  { value: "PROBATION", label: "Thử việc" },
  { value: "CONTRACT", label: "Hợp đồng" },
];

export default function StaffProfileModal({
  open,
  onClose,
  staff,
  shopId,
  onSuccess,
  isNewExternal = false,
}) {
  const { branches } = useShop();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isExternal = isNewExternal || staff?.external === true;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [salary, setSalary] = useState("");
  const [contractType, setContractType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [note, setNote] = useState("");

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setBranchId("");
    setPosition("");
    setDepartment("");
    setLevel("");
    setStartDate(null);
    setSalary("");
    setContractType("");
    setIdNumber("");
    setBankName("");
    setBankAccountNumber("");
    setBankAccountHolder("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setNote("");
  };

  useEffect(() => {
    if (!open || !shopId) return;

    if (isNewExternal) {
      resetForm();
      return;
    }

    if (!staff) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        let data;
        if (staff.external && staff.id) {
          const res = await getExternalProfile(shopId, staff.id);
          data = res.data?.data;
        } else if (staff.userId) {
          const res = await getStaffProfile(shopId, staff.userId);
          data = res.data?.data;
        }
        if (data) {
          setFullName(data.fullName || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setBranchId(data.branchId || "");
          setPosition(data.position || "");
          setDepartment(data.department || "");
          setLevel(data.level || "");
          setStartDate(data.startDate ? new Date(data.startDate) : null);
          setSalary(data.salary != null ? String(data.salary) : "");
          setContractType(data.contractType || "");
          setIdNumber(data.idNumber || "");
          setBankName(data.bankName || "");
          setBankAccountNumber(data.bankAccountNumber || "");
          setBankAccountHolder(data.bankAccountHolder || "");
          setEmergencyContactName(data.emergencyContactName || "");
          setEmergencyContactPhone(data.emergencyContactPhone || "");
          setNote(data.note || "");
        }
      } catch (err) {
        console.error("Fetch staff profile error:", err);
        toast.error("Không thể tải hồ sơ nhân sự.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, staff, shopId, isNewExternal]);

  const handleSubmit = async () => {
    if (isExternal && !fullName.trim()) {
      toast.error("Vui lòng nhập họ tên nhân viên.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        branchId: branchId && branchId !== "__none__" ? branchId : null,
        position: position.trim() || null,
        department: department.trim() || null,
        level: level.trim() || null,
        startDate: startDate ? startDate.toISOString().split("T")[0] : null,
        salary: salary ? Number(salary) : null,
        contractType: contractType || null,
        idNumber: idNumber.trim() || null,
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankAccountHolder: bankAccountHolder.trim() || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        note: note.trim() || null,
      };

      let res;
      if (isNewExternal) {
        res = await createExternalStaff(shopId, payload);
      } else if (staff?.external && staff?.id) {
        res = await updateExternalProfile(shopId, staff.id, payload);
      } else if (staff?.userId) {
        res = await saveStaffProfile(shopId, staff.userId, payload);
      }

      if (res?.data?.success) {
        toast.success(
          isNewExternal
            ? "Thêm nhân viên ngoài hệ thống thành công."
            : "Lưu hồ sơ nhân sự thành công.",
        );
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(res?.data?.message || "Lưu hồ sơ thất bại.");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNewExternal && !staff) return null;

  const displayName = isNewExternal
    ? "nhân viên mới"
    : staff?.fullName || staff?.email || "-";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isNewExternal
              ? "Thêm nhân viên ngoài hệ thống"
              : "Hồ sơ nhân sự"}
          </DialogTitle>
          <DialogDescription>
            {isNewExternal ? (
              "Tạo hồ sơ cho nhân viên không cần tài khoản hệ thống (tạp vụ, bưng bê...)."
            ) : (
              <>
                Quản lý thông tin nhân sự cho{" "}
                <span className="font-medium">{displayName}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 py-2">
            {!isNewExternal && staff && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                {staff.avatarUrl ? (
                  <img
                    src={staff.avatarUrl}
                    alt={staff.fullName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {(staff.fullName || staff.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {staff.fullName || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {staff.email || "-"}
                  </p>
                </div>
                {staff.external ? (
                  <Badge variant="secondary">Ngoài hệ thống</Badge>
                ) : (
                  <Badge variant="outline">
                    {SHOP_ROLE_LABELS[staff.role] || staff.role}
                  </Badge>
                )}
              </div>
            )}

            {isExternal && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Thông tin cá nhân
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="sp-fullname">
                      Họ tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sp-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sp-phone-ext">Số điện thoại</Label>
                    <Input
                      id="sp-phone-ext"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sp-email-ext">Email</Label>
                    <Input
                      id="sp-email-ext"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: email@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Thông tin công việc
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Chi nhánh</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chưa gắn chi nhánh" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="__none__">
                        Không gắn chi nhánh
                      </SelectItem>
                      {(branches || []).map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-position">Vị trí</Label>
                  <Input
                    id="sp-position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="VD: Thu ngân, Tạp vụ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-department">Phòng ban</Label>
                  <Input
                    id="sp-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="VD: Bếp, Phục vụ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-level">Cấp bậc</Label>
                  <Input
                    id="sp-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="VD: Thử việc, Chính thức..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ngày vào làm</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, "dd/MM/yyyy", { locale: vi })
                          : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={vi}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Hợp đồng & Lương
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Loại hợp đồng</Label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {CONTRACT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-salary">Lương cơ bản (VNĐ)</Label>
                  <Input
                    id="sp-salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="VD: 8000000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Giấy tờ
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="sp-id">Số CCCD / CMND</Label>
                <Input
                  id="sp-id"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="VD: 001234567890"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tài khoản ngân hàng
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp-bank">Tên ngân hàng</Label>
                  <Input
                    id="sp-bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="VD: Vietcombank"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-bank-number">Số tài khoản</Label>
                  <Input
                    id="sp-bank-number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="VD: 1234567890"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-bank-holder">Chủ tài khoản</Label>
                <Input
                  id="sp-bank-holder"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Liên hệ khẩn cấp
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp-ec-name">Họ tên</Label>
                  <Input
                    id="sp-ec-name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Họ tên người liên hệ"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-ec-phone">Số điện thoại</Label>
                  <Input
                    id="sp-ec-phone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ghi chú
              </h4>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm về nhân viên..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isNewExternal ? "Thêm nhân viên" : "Lưu hồ sơ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
