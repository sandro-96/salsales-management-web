import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
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
import { getShopRoleLabel } from "@/utils/shopLabels";

const CONTRACT_TYPE_VALUES = ["FULL_TIME", "PART_TIME", "PROBATION", "CONTRACT"];

export default function StaffProfileModal({
  open,
  onClose,
  staff,
  shopId,
  onSuccess,
  isNewExternal = false,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;
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
  const [startDateOpen, setStartDateOpen] = useState(false);
  const startDateBlockRef = useRef(null);

  const contractLabel = (type) =>
    t(`pages.staffs.contractType.${type}`, { defaultValue: type });

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
    if (!open) {
      setStartDateOpen(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!startDateOpen) return;
    startDateBlockRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [startDateOpen]);

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
        toast.error(t("pages.staffs.profileModal.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, staff, shopId, isNewExternal, t]);

  const handleSubmit = async () => {
    if (isExternal && !fullName.trim()) {
      toast.error(t("pages.staffs.profileModal.fullNameRequired"));
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
            ? t("pages.staffs.profileModal.createExternalSuccess")
            : t("pages.staffs.profileModal.saveSuccess"),
        );
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(res?.data?.message || t("pages.staffs.profileModal.saveFail"));
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || t("pages.staffs.profileModal.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNewExternal && !staff) return null;

  const displayName = isNewExternal
    ? t("pages.staffs.profileModal.newStaffDisplayName")
    : staff?.fullName || staff?.email || "-";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(90dvh,680px)] flex-col gap-4 overflow-hidden p-4 sm:max-w-[640px] sm:p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 text-left">
          <DialogTitle>
            {isNewExternal
              ? t("pages.staffs.profileModal.titleNewExternal")
              : t("pages.staffs.profileModal.title")}
          </DialogTitle>
          <DialogDescription>
            {isNewExternal
              ? t("pages.staffs.profileModal.descriptionNewExternal")
              : t("pages.staffs.profileModal.description", { name: displayName })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable]">
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
                  <Badge variant="secondary">
                    {t("pages.staffs.profileModal.externalBadge")}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {getShopRoleLabel(t, staff.role) || staff.role}
                  </Badge>
                )}
              </div>
            )}

            {isExternal && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("pages.staffs.profileModal.sectionPersonal")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="sp-fullname">
                      {t("pages.staffs.profileModal.fullNameLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sp-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("pages.staffs.profileModal.fullNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sp-phone-ext">
                      {t("pages.staffs.profileModal.phoneLabel")}
                    </Label>
                    <Input
                      id="sp-phone-ext"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("pages.staffs.profileModal.phonePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sp-email-ext">
                      {t("pages.staffs.profileModal.emailLabel")}
                    </Label>
                    <Input
                      id="sp-email-ext"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("pages.staffs.profileModal.emailPlaceholder")}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionWork")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>{t("pages.staffs.profileModal.branchLabel")}</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("pages.staffs.profileModal.branchPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="__none__">
                        {t("pages.staffs.profileModal.branchNone")}
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
                  <Label htmlFor="sp-position">
                    {t("pages.staffs.profileModal.positionLabel")}
                  </Label>
                  <Input
                    id="sp-position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder={t("pages.staffs.profileModal.positionPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-department">
                    {t("pages.staffs.profileModal.departmentLabel")}
                  </Label>
                  <Input
                    id="sp-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={t("pages.staffs.profileModal.departmentPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-level">
                    {t("pages.staffs.profileModal.levelLabel")}
                  </Label>
                  <Input
                    id="sp-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder={t("pages.staffs.profileModal.levelPlaceholder")}
                  />
                </div>
                <div
                  ref={startDateBlockRef}
                  className="space-y-1.5 min-w-0 col-span-1 sm:col-span-2"
                >
                  <Label>{t("pages.staffs.profileModal.startDateLabel")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                    aria-expanded={startDateOpen}
                    onClick={() => setStartDateOpen((v) => !v)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: dateLocale })
                      : t("pages.staffs.profileModal.startDatePlaceholder")}
                  </Button>
                  {startDateOpen && (
                    <div className="w-full rounded-md border bg-popover shadow-sm">
                      <div className="flex justify-center overflow-x-auto p-1">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(d) => {
                            if (d) {
                              d.setHours(0, 0, 0, 0);
                              setStartDate(d);
                              setStartDateOpen(false);
                            }
                          }}
                          locale={dateLocale}
                          className="p-2 sm:p-3 [--cell-size:1.65rem] sm:[--cell-size:2rem]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionContractSalary")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("pages.staffs.profileModal.contractTypeLabel")}</Label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("pages.staffs.profileModal.contractTypePlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {CONTRACT_TYPE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {contractLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-salary">
                    {t("pages.staffs.profileModal.salaryLabel")}
                  </Label>
                  <Input
                    id="sp-salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder={t("pages.staffs.profileModal.salaryPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionDocuments")}
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="sp-id">
                  {t("pages.staffs.profileModal.idNumberLabel")}
                </Label>
                <Input
                  id="sp-id"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={t("pages.staffs.profileModal.idNumberPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionBank")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp-bank">
                    {t("pages.staffs.profileModal.bankNameLabel")}
                  </Label>
                  <Input
                    id="sp-bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t("pages.staffs.profileModal.bankNamePlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-bank-number">
                    {t("pages.staffs.profileModal.bankAccountNumberLabel")}
                  </Label>
                  <Input
                    id="sp-bank-number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder={t(
                      "pages.staffs.profileModal.bankAccountNumberPlaceholder",
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-bank-holder">
                  {t("pages.staffs.profileModal.bankAccountHolderLabel")}
                </Label>
                <Input
                  id="sp-bank-holder"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder={t(
                    "pages.staffs.profileModal.bankAccountHolderPlaceholder",
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionEmergency")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sp-ec-name">
                    {t("pages.staffs.profileModal.emergencyNameLabel")}
                  </Label>
                  <Input
                    id="sp-ec-name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder={t(
                      "pages.staffs.profileModal.emergencyNamePlaceholder",
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sp-ec-phone">
                    {t("pages.staffs.profileModal.emergencyPhoneLabel")}
                  </Label>
                  <Input
                    id="sp-ec-phone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder={t(
                      "pages.staffs.profileModal.emergencyPhonePlaceholder",
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("pages.staffs.profileModal.sectionNote")}
              </h4>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("pages.staffs.profileModal.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background pt-4 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("pages.staffs.profileModal.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading} variant="success">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isNewExternal
              ? t("pages.staffs.profileModal.submitNew")
              : t("pages.staffs.profileModal.submitSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
