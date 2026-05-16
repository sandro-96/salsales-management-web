import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(90dvh,680px)] flex-col gap-4 overflow-hidden p-4 sm:max-w-[520px] sm:p-6"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 text-left">
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable]">
          <div className="space-y-2">
            <Label
              htmlFor="cust-name"
              className={
                attemptedSubmit && !name.trim() ? "text-destructive" : undefined
              }
            >
              {t("pages.customers.formModal.nameLabel")} *
            </Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.customers.formModal.namePlaceholder")}
              autoFocus
              disabled={readOnly}
              aria-invalid={attemptedSubmit && !name.trim()}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cust-phone">
                {t("pages.customers.formModal.phoneLabel")}
              </Label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("pages.customers.formModal.phonePlaceholder")}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">
                {t("pages.customers.formModal.emailLabel")}
              </Label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("pages.customers.formModal.emailPlaceholder")}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-address">
              {t("pages.customers.formModal.addressLabel")}
            </Label>
            <Input
              id="cust-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("pages.customers.formModal.addressPlaceholder")}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("pages.customers.formModal.branchLabel")}</Label>
            <Select
              value={branchId || "__none__"}
              onValueChange={(v) => setBranchId(v === "__none__" ? "" : v)}
              disabled={isEdit || readOnly}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("pages.customers.formModal.branchPlaceholder")}
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

          <div className="space-y-2">
            <Label htmlFor="cust-note">
              {t("pages.customers.formModal.noteLabel")}
            </Label>
            <Textarea
              id="cust-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("pages.customers.formModal.notePlaceholder")}
              rows={3}
              disabled={readOnly}
            />
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background pt-4 sm:gap-0">
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
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
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
