import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { CalendarIcon, Loader2, Search, Package, Store } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { createPromotion, updatePromotion } from "../../api/promotionApi.js";
import { getProducts } from "../../api/productApi.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { cn } from "@/lib/utils";

const toLocalDateTime = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const parseLocalDateTime = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

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

function DatePickerField({
  label,
  value,
  open,
  onOpenChange,
  onSelect,
  disabled,
  invalid,
  blockRef,
  dateLocale,
  pickDateLabel,
  otherOpen,
  setOtherOpen,
}) {
  return (
    <div ref={blockRef} className="min-w-0 space-y-2">
      <Label className={invalid ? "text-destructive" : undefined}>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          invalid && "border-destructive",
        )}
        aria-expanded={open}
        aria-invalid={invalid}
        onClick={() => {
          setOtherOpen(false);
          onOpenChange((v) => !v);
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {value
          ? format(value, "dd/MM/yyyy", { locale: dateLocale })
          : pickDateLabel}
      </Button>
      {open && (
        <div className="flex justify-center overflow-hidden rounded-md border bg-popover shadow-sm">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onSelect}
            disabled={disabled}
            locale={dateLocale}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}

export default function PromotionFormModal({
  open,
  onClose,
  promotion,
  shopId,
  branches,
  onSuccess,
}) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;
  const isEdit = !!promotion;
  const { hasShopPermission } = useShopPermissions();
  const canUpdate = hasShopPermission(PERM.PROMOTION_UPDATE);
  const canCreate = hasShopPermission(PERM.PROMOTION_CREATE);
  const readOnly = isEdit ? !canUpdate : !canCreate;

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [active, setActive] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [priority, setPriority] = useState("0");
  const [applyAll, setApplyAll] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productKeyword, setProductKeyword] = useState("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const startDateBlockRef = useRef(null);
  const endDateBlockRef = useRef(null);

  useEffect(() => {
    if (!startDateOpen) return;
    startDateBlockRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [startDateOpen]);

  useEffect(() => {
    if (!endDateOpen) return;
    endDateBlockRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [endDateOpen]);

  useEffect(() => {
    if (!open) return;
    setAttemptedSubmit(false);
    if (promotion) {
      setName(promotion.name || "");
      setDiscountType(promotion.discountType || "PERCENT");
      setDiscountValue(
        promotion.discountValue != null ? String(promotion.discountValue) : "",
      );
      setStartDate(parseLocalDateTime(promotion.startDate));
      setEndDate(parseLocalDateTime(promotion.endDate));
      setActive(promotion.active ?? true);
      setBranchId(promotion.branchId || "");
      setPriority(
        promotion.priority != null ? String(promotion.priority) : "0",
      );
      const ids = promotion.applicableProductIds;
      if (Array.isArray(ids) && ids.length > 0) {
        setApplyAll(false);
        setSelectedProductIds(ids);
      } else {
        setApplyAll(true);
        setSelectedProductIds([]);
      }
    } else {
      setName("");
      setDiscountType("PERCENT");
      setDiscountValue("");
      setStartDate(null);
      setEndDate(null);
      setActive(true);
      setBranchId("");
      setPriority("0");
      setApplyAll(true);
      setSelectedProductIds([]);
    }
    setProductKeyword("");
    setStartDateOpen(false);
    setEndDateOpen(false);
  }, [open, promotion]);

  const fetchProducts = useCallback(async () => {
    if (!shopId) return;
    setProductsLoading(true);
    try {
      const res = await getProducts(shopId, { page: 0, size: 200 });
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setProducts(data.content ?? []);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (open && !applyAll) {
      fetchProducts();
    }
  }, [open, applyAll, fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!productKeyword.trim()) return products;
    const kw = productKeyword.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(kw) ||
        p.sku?.toLowerCase().includes(kw),
    );
  }, [products, productKeyword]);

  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const validate = () => {
    if (!name.trim()) {
      toast.error(t("pages.promotions.formModal.nameRequired"));
      return false;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      toast.error(t("pages.promotions.formModal.discountPositive"));
      return false;
    }
    if (discountType === "PERCENT" && Number(discountValue) > 100) {
      toast.error(t("pages.promotions.formModal.percentMax"));
      return false;
    }
    if (!startDate) {
      toast.error(t("pages.promotions.formModal.startRequired"));
      return false;
    }
    if (!endDate) {
      toast.error(t("pages.promotions.formModal.endRequired"));
      return false;
    }
    if (startDate >= endDate) {
      toast.error(t("pages.promotions.formModal.endAfterStart"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      discountType,
      discountValue: Number(discountValue),
      priority: Math.max(
        0,
        Math.min(1_000_000, Math.floor(Number(priority)) || 0),
      ),
      applicableProductIds:
        applyAll || selectedProductIds.length === 0
          ? null
          : selectedProductIds,
      startDate: toLocalDateTime(startDate),
      endDate: toLocalDateTime(endDate),
      active,
      branchId: branchId || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updatePromotion(promotion.id, shopId, payload);
        if (res.data?.success) {
          toast.success(t("pages.promotions.formModal.updateSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || t("pages.promotions.formModal.updateFail"));
        }
      } else {
        const res = await createPromotion(shopId, payload);
        if (res.data?.success) {
          toast.success(t("pages.promotions.formModal.createSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || t("pages.promotions.formModal.createFail"));
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || t("pages.promotions.formModal.genericError");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(92dvh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle>
            {readOnly
              ? t("pages.promotions.formModal.viewTitle")
              : isEdit
                ? t("pages.promotions.formModal.editTitle")
                : t("pages.promotions.formModal.createTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? t("pages.promotions.formModal.editDesc")
              : t("pages.promotions.formModal.createDesc")}
          </DialogDescription>
        </DialogHeader>

        
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 [scrollbar-gutter:stable]">
          <fieldset
            disabled={readOnly}
            className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 disabled:opacity-70"
          >
          <FormSectionCard
            title={t("pages.promotions.formModal.sectionBasic")}
            description={t("pages.promotions.formModal.sectionBasicDesc")}
          >
          <div className="space-y-2">
            <Label
              htmlFor="promo-name"
              className={attemptedSubmit && !name.trim() ? "text-destructive" : undefined}
            >
              {t("pages.promotions.formModal.nameLabel")} *
            </Label>
            <Input
              id="promo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.promotions.formModal.namePlaceholder")}
              autoFocus
              aria-invalid={attemptedSubmit && !name.trim()}
            />
          </div>
          </FormSectionCard>

          <FormSectionCard
            title={t("pages.promotions.formModal.sectionDiscount")}
            description={t("pages.promotions.formModal.sectionDiscountDesc")}
          >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className={attemptedSubmit && !discountType ? "text-destructive" : undefined}>
                {t("pages.promotions.formModal.discountTypeLabel")} *
              </Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger aria-invalid={attemptedSubmit && !discountType}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="PERCENT">
                    {t("pages.promotions.formModal.discountPercent")}
                  </SelectItem>
                  <SelectItem value="AMOUNT">
                    {t("pages.promotions.formModal.discountAmount")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="promo-value"
                className={
                  attemptedSubmit && (!discountValue || Number(discountValue) <= 0)
                    ? "text-destructive"
                    : undefined
                }
              >
                {t("pages.promotions.formModal.discountValueLabel")} *{" "}
                {discountType === "PERCENT"
                  ? t("pages.promotions.formModal.discountValueMaxPercent")
                  : t("pages.promotions.formModal.discountValueVnd")}
              </Label>
              <NumericInput
                id="promo-value"
                value={discountValue}
                onChange={setDiscountValue}
                formatted={discountType === "AMOUNT"}
                max={discountType === "PERCENT" ? 100 : undefined}
                placeholder={
                  discountType === "PERCENT"
                    ? t("pages.promotions.formModal.valuePlaceholderPercent")
                    : t("pages.promotions.formModal.valuePlaceholderAmount")
                }
                aria-invalid={attemptedSubmit && (!discountValue || Number(discountValue) <= 0)}
              />
            </div>
          </div>

          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="promo-priority">
              {t("pages.promotions.formModal.priorityLabel")}
            </Label>
            <NumericInput
              id="promo-priority"
              value={priority}
              onChange={setPriority}
              formatted={false}
              max={1_000_000}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              {t("pages.promotions.formModal.priorityHint")}
            </p>
          </div>
          </FormSectionCard>

          <FormSectionCard
            title={t("pages.promotions.formModal.sectionSchedule")}
            description={t("pages.promotions.formModal.sectionScheduleDesc")}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePickerField
                label={`${t("pages.promotions.formModal.startDateLabel")} *`}
                value={startDate}
                open={startDateOpen}
                onOpenChange={setStartDateOpen}
                otherOpen={endDateOpen}
                setOtherOpen={setEndDateOpen}
                blockRef={startDateBlockRef}
                dateLocale={dateLocale}
                pickDateLabel={t("pages.promotions.formModal.pickDate")}
                invalid={attemptedSubmit && !startDate}
                onSelect={(d) => {
                  if (d) {
                    d.setHours(0, 0, 0, 0);
                    setStartDate(d);
                    setStartDateOpen(false);
                  }
                }}
              />
              <DatePickerField
                label={`${t("pages.promotions.formModal.endDateLabel")} *`}
                value={endDate}
                open={endDateOpen}
                onOpenChange={setEndDateOpen}
                otherOpen={startDateOpen}
                setOtherOpen={setStartDateOpen}
                blockRef={endDateBlockRef}
                dateLocale={dateLocale}
                pickDateLabel={t("pages.promotions.formModal.pickDate")}
                invalid={attemptedSubmit && !endDate}
                disabled={(d) => startDate && d < startDate}
                onSelect={(d) => {
                  if (d) {
                    d.setHours(23, 59, 59, 0);
                    setEndDate(d);
                    setEndDateOpen(false);
                  }
                }}
              />
            </div>
          </FormSectionCard>

          <FormSectionCard
            title={t("pages.promotions.formModal.sectionScope")}
            description={t("pages.promotions.formModal.sectionScopeDesc")}
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                {t("pages.promotions.formModal.scopeLabel")}
              </Label>
              <Select
                value={branchId || "__all__"}
                onValueChange={(v) => setBranchId(v === "__all__" ? "" : v)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("pages.promotions.list.scopeAllShop")}
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">
                    {t("pages.promotions.formModal.scopeAllShop")}
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
                  {t("pages.promotions.formModal.scopeLockedHint")}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-3">
              <div className="min-w-0">
                <Label className="text-sm font-medium">
                  {t("pages.promotions.formModal.activeLabel")}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("pages.promotions.formModal.activeHint")}
                </p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </FormSectionCard>

          <FormSectionCard
            title={t("pages.promotions.formModal.sectionProducts")}
            description={t("pages.promotions.formModal.sectionProductsDesc")}
            action={
              !applyAll && selectedProductIds.length > 0 ? (
                <Badge variant="secondary" className="tabular-nums">
                  {selectedProductIds.length}
                </Badge>
              ) : null
            }
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  applyAll
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setApplyAll(true);
                  setSelectedProductIds([]);
                }}
              >
                {t("pages.promotions.formModal.applyAllProducts")}
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  !applyAll
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setApplyAll(false)}
              >
                {t("pages.promotions.formModal.applySelected")}
              </button>
            </div>

            {!applyAll && (
              <div className="overflow-hidden rounded-lg border">
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productKeyword}
                      onChange={(e) => setProductKeyword(e.target.value)}
                      placeholder={t("pages.promotions.formModal.searchProducts")}
                      className="h-9 pl-8 text-sm"
                    />
                  </div>
                </div>
                {selectedProductIds.length > 0 && (
                  <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      {t("pages.promotions.formModal.selectedCount", {
                        count: selectedProductIds.length,
                      })}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setSelectedProductIds([])}
                    >
                      {t("pages.promotions.formModal.clearSelection")}
                    </button>
                  </div>
                )}
                <div className="max-h-[min(14rem,32vh)] overflow-y-auto overscroll-contain">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const id = p.productId || p.id;
                      const checked = selectedProductIds.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex cursor-pointer items-center gap-3 border-b border-border/40 px-3 py-2.5 transition-colors last:border-0 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleProduct(id)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            {p.sku && (
                              <p className="font-mono text-xs text-muted-foreground">
                                {p.sku}
                              </p>
                            )}
                          </div>
                          {p.defaultPrice != null && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {Number(p.defaultPrice).toLocaleString(numberLocale)}Ä‘
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {t("pages.promotions.formModal.noProductsFound")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {applyAll && (
              <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {t("pages.promotions.formModal.applyAllProductsHint")}
              </p>
            )}
          </FormSectionCard>

          </fieldset>
        </div>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background px-4 py-4 sm:gap-0 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly
              ? t("pages.promotions.formModal.close")
              : t("pages.promotions.formModal.cancel")}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={submitting} variant="success">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit
                ? t("pages.promotions.formModal.save")
                : t("pages.promotions.formModal.create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
