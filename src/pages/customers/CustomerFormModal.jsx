import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, User, Phone, Mail, MapPin, Building2, FileText } from "lucide-react";

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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createCustomer, updateCustomer } from "../../api/customerApi.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormSectionCard({ title, description, action, children, className }) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className="border-b border-border/60 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 py-4">{children}</CardContent>
    </Card>
  );
}

function FieldLabel({ icon: Icon, htmlFor, required, invalid, children }) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "flex items-center gap-1.5",
        invalid && "text-destructive",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      {children}
      {required ? <span className="text-red-500">*</span> : null}
    </Label>
  );
}

export default function CustomerFormModal({
  open,
  onClose,
  customer,
  shopId,
  branches,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEdit = !!customer;
  const { hasShopPermission } = useShopPermissions();
  const canEdit = hasShopPermission(PERM.CUSTOMER_UPDATE);
  const readOnly = isEdit && !canEdit;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const emailInvalid = useMemo(
    () => Boolean(email.trim()) && !EMAIL_RE.test(email.trim()),
    [email],
  );

  useEffect(() => {
    if (!open) return;
    setAttemptedSubmit(false);
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setNote(customer.note || "");
      setBranchId(customer.branchId || "");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNote("");
      setBranchId("");
    }
  }, [open, customer]);

  const validate = () => {
    if (!name.trim()) {
      toast.error(t("pages.customers.formModal.nameRequired"));
      return false;
    }
    if (emailInvalid) {
      toast.error(t("pages.customers.formModal.emailInvalid"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      note: note.trim() || null,
      branchId: branchId || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateCustomer(customer.id, shopId, payload);
        if (res.data?.success) {
          toast.success(t("pages.customers.formModal.updateSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(
            res.data?.message || t("pages.customers.formModal.updateFail"),
          );
        }
      } else {
        const res = await createCustomer(shopId, payload);
        if (res.data?.success) {
          toast.success(t("pages.customers.formModal.createSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(
            res.data?.message || t("pages.customers.formModal.createFail"),
          );
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t("pages.customers.formModal.genericError");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const showBranchSection = (branches?.length ?? 0) > 0 || isEdit;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(92dvh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle>
            {readOnly
              ? t("pages.customers.formModal.viewTitle")
              : isEdit
                ? t("pages.customers.formModal.editTitle")
                : t("pages.customers.formModal.createTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? t("pages.customers.formModal.editDesc")
              : t("pages.customers.formModal.createDesc")}
          </DialogDescription>
        </DialogHeader>

        <fieldset
          disabled={readOnly}
          className="m-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain border-0 px-4 py-4 sm:px-6 [scrollbar-gutter:stable] disabled:opacity-70"
        >
          <div className="flex min-w-0 flex-col gap-4">
            <FormSectionCard
              title={t("pages.customers.formModal.sectionBasic")}
              description={t("pages.customers.formModal.sectionBasicDesc")}
            >
              <div className="space-y-2">
                <FieldLabel
                  icon={User}
                  htmlFor="cust-name"
                  required
                  invalid={attemptedSubmit && !name.trim()}
                >
                  {t("pages.customers.formModal.nameLabel")}
                </FieldLabel>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("pages.customers.formModal.namePlaceholder")}
                  autoFocus
                  aria-invalid={attemptedSubmit && !name.trim()}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              title={t("pages.customers.formModal.sectionContact")}
              description={t("pages.customers.formModal.sectionContactDesc")}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel icon={Phone} htmlFor="cust-phone">
                    {t("pages.customers.formModal.phoneLabel")}
                  </FieldLabel>
                  <Input
                    id="cust-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("pages.customers.formModal.phonePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel
                    icon={Mail}
                    htmlFor="cust-email"
                    invalid={attemptedSubmit && emailInvalid}
                  >
                    {t("pages.customers.formModal.emailLabel")}
                  </FieldLabel>
                  <Input
                    id="cust-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("pages.customers.formModal.emailPlaceholder")}
                    aria-invalid={attemptedSubmit && emailInvalid}
                  />
                  {attemptedSubmit && emailInvalid && (
                    <p className="text-xs text-destructive">
                      {t("pages.customers.formModal.emailInvalid")}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel icon={MapPin} htmlFor="cust-address">
                  {t("pages.customers.formModal.addressLabel")}
                </FieldLabel>
                <Input
                  id="cust-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("pages.customers.formModal.addressPlaceholder")}
                  autoComplete="street-address"
                />
              </div>
            </FormSectionCard>

            {showBranchSection && (
              <FormSectionCard
                title={t("pages.customers.formModal.sectionBranch")}
                description={t("pages.customers.formModal.sectionBranchDesc")}
              >
                <div className="space-y-2">
                  <FieldLabel icon={Building2}>
                    {t("pages.customers.formModal.branchLabel")}
                  </FieldLabel>
                  <Select
                    value={branchId || "__none__"}
                    onValueChange={(v) => setBranchId(v === "__none__" ? "" : v)}
                    disabled={isEdit}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "pages.customers.formModal.branchPlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="__none__">
                        {t("pages.customers.formModal.branchNone")}
                      </SelectItem>
                      {branches?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <p className="text-xs text-muted-foreground">
                      {t("pages.customers.formModal.branchLockedHint")}
                    </p>
                  )}
                </div>
              </FormSectionCard>
            )}

            <FormSectionCard
              title={t("pages.customers.formModal.sectionNote")}
              description={t("pages.customers.formModal.sectionNoteDesc")}
            >
              <div className="space-y-2">
                <FieldLabel icon={FileText} htmlFor="cust-note">
                  {t("pages.customers.formModal.noteLabel")}
                </FieldLabel>
                <Textarea
                  id="cust-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("pages.customers.formModal.notePlaceholder")}
                  rows={3}
                  className="min-h-[5.5rem] resize-y"
                />
              </div>
            </FormSectionCard>
          </div>
        </fieldset>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background px-4 py-4 sm:gap-0 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly
              ? t("pages.customers.formModal.close")
              : t("pages.customers.formModal.cancel")}
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="success"
            >
              {submitting && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              {isEdit
                ? t("pages.customers.formModal.save")
                : t("pages.customers.formModal.addCustomer")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
