import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addStaff } from "../../api/staffApi.js";
import { SHOP_ROLE } from "../../constants/shopRoles.js";
import { buildShopRolesAssignable } from "@/utils/shopLabels";

export default function AddStaffModal({ open, onClose, shopId, onSuccess }) {
  const { t } = useTranslation();
  const assignableRoles = useMemo(() => buildShopRolesAssignable(t), [t]);
  const defaultRole = SHOP_ROLE.STAFF;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const emailTrimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailInvalid = attemptedSubmit && (!emailTrimmed || !emailRegex.test(emailTrimmed));
  const roleInvalid = attemptedSubmit && !role;

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole(defaultRole);
      setAttemptedSubmit(false);
    }
  }, [open]);

  const validate = () => {
    if (!emailTrimmed) {
      toast.error(t("pages.staffs.addModal.emailRequired"));
      return false;
    }
    if (!emailRegex.test(emailTrimmed)) {
      toast.error(t("pages.staffs.addModal.emailInvalid"));
      return false;
    }
    if (!role) {
      toast.error(t("pages.staffs.addModal.roleRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await addStaff(shopId, {
        email: email.trim(),
        role,
      });
      if (res.data?.success) {
        toast.success(t("pages.staffs.addModal.addSuccess"));
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(res.data?.message || t("pages.staffs.addModal.addFail"));
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error(t("pages.staffs.addModal.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(90dvh,680px)] flex-col gap-4 overflow-hidden p-4 sm:max-w-[440px] sm:p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 text-left">
          <DialogTitle>{t("pages.staffs.addModal.title")}</DialogTitle>
          <DialogDescription>
            {t("pages.staffs.addModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable]">
          <div className="space-y-2">
            <Label
              htmlFor="staff-email"
              className={emailInvalid ? "text-destructive" : undefined}
            >
              {t("pages.staffs.addModal.emailLabel")}
            </Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("pages.staffs.addModal.emailPlaceholder")}
              autoFocus
              aria-invalid={emailInvalid}
            />
            <p className="text-xs text-muted-foreground">
              {t("pages.staffs.addModal.emailHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className={roleInvalid ? "text-destructive" : undefined}>
              {t("pages.staffs.addModal.roleLabel")}
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-invalid={roleInvalid}>
                <SelectValue placeholder={t("pages.staffs.addModal.rolePlaceholder")} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {assignableRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background pt-4 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("pages.staffs.addModal.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="success">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {t("pages.staffs.addModal.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
