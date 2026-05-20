import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Mail, Shield } from "lucide-react";

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
import {
  FormSectionCard,
  FieldLabel,
} from "@/components/forms/FormSectionCard.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddStaffModal({ open, onClose, shopId, onSuccess }) {
  const { t } = useTranslation();
  const assignableRoles = useMemo(() => buildShopRolesAssignable(t), [t]);
  const defaultRole = SHOP_ROLE.STAFF;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const emailTrimmed = email.trim();
  const emailInvalid =
    attemptedSubmit && (!emailTrimmed || !EMAIL_RE.test(emailTrimmed));
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
    if (!EMAIL_RE.test(emailTrimmed)) {
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
      toast.error(msg || t("pages.staffs.addModal.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(92dvh,680px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle>{t("pages.staffs.addModal.title")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("pages.staffs.addModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 [scrollbar-gutter:stable]">
          <div className="flex flex-col gap-4">
            <FormSectionCard
              title={t("pages.staffs.addModal.sectionInvite")}
              description={t("pages.staffs.addModal.sectionInviteDesc")}
            >
              <div className="space-y-2">
                <FieldLabel
                  icon={Mail}
                  htmlFor="staff-email"
                  required
                  invalid={emailInvalid}
                >
                  {t("pages.staffs.addModal.emailLabel")}
                </FieldLabel>
                <Input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("pages.staffs.addModal.emailPlaceholder")}
                  autoFocus
                  aria-invalid={emailInvalid}
                />
                {emailInvalid && !emailTrimmed && (
                  <p className="text-xs text-destructive">
                    {t("pages.staffs.addModal.emailRequired")}
                  </p>
                )}
                {emailInvalid && emailTrimmed && (
                  <p className="text-xs text-destructive">
                    {t("pages.staffs.addModal.emailInvalid")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("pages.staffs.addModal.emailHint")}
                </p>
              </div>
            </FormSectionCard>

            <FormSectionCard
              title={t("pages.staffs.addModal.sectionRole")}
              description={t("pages.staffs.addModal.sectionRoleDesc")}
            >
              <div className="space-y-2">
                <FieldLabel icon={Shield} invalid={roleInvalid}>
                  {t("pages.staffs.addModal.roleLabel")}
                </FieldLabel>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger aria-invalid={roleInvalid}>
                    <SelectValue
                      placeholder={t("pages.staffs.addModal.rolePlaceholder")}
                    />
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
            </FormSectionCard>
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background px-4 py-4 sm:gap-0 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("pages.staffs.addModal.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="success">
            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {t("pages.staffs.addModal.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
