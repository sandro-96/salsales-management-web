"use client";

import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, Calendar as CalendarIcon, Wifi } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES } from "@/constants/countries";
import { INVOICE_LOCALES } from "@/utils/invoiceLocale.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFlagUrl } from "@/utils/commonUtils";
import { cn } from "@/lib/utils"; // giả sử bạn có utils cn cho className
import { useShopPermissions } from "@/hooks/useShopPermissions.js";
import { PERM } from "@/constants/shopPermissions.js";
import BranchTimePopover from "@/components/branch/BranchTimePopover.jsx";

/** Chuẩn hóa LocalTime từ API (vd. "09:30:00") thành giá trị cho input type="time". */
function toTimeInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const m = value.match(/^(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
    return value;
  }
  return "";
}

function buildBranchFormSchema(t) {
  return z
  .object({
    name: z.string().min(1, t("pages.branches.form.validation.nameRequired")),
    address: z.string().min(10, t("pages.branches.form.validation.addressMin")),
    phone: z.string().min(1, t("pages.branches.form.validation.phoneRequired")),
    countryCode: z.string().optional().default("VN"),

    openingDate: z.date().optional().nullable(),

    openingTime: z.string().optional().nullable(),
    closingTime: z.string().optional().nullable(),

    managerName: z.string().optional().nullable(),
    managerPhone: z.string().optional().nullable(),

    capacity: z
      .union([
        z.coerce.number().int().positive(),
        z.literal("").transform(() => undefined),
      ])
      .optional()
      .nullable(),

    description: z.string().optional().nullable(),

    taxRegistrationNumber: z
      .string()
      .max(32, t("pages.branches.form.validation.taxMax"))
      .optional()
      .nullable(),

    wifiSsid: z
      .string()
      .max(64, t("pages.branches.form.validation.wifiSsidMax"))
      .optional()
      .nullable(),
    wifiPassword: z
      .string()
      .max(128, t("pages.branches.form.validation.wifiPasswordMax"))
      .optional()
      .nullable(),

    invoiceLocale: z.enum(["vi", "en"]).default("vi"),

    isDefault: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const countryInfo = COUNTRIES.find((c) => c.code === data.countryCode);
    if (
      countryInfo &&
      data.phone &&
      !countryInfo.phonePattern.test(data.phone)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("pages.branches.form.validation.phoneInvalidForCountry", {
          country: countryInfo.name,
        }),
        path: ["phone"],
      });
    }
  });
}

export default function BranchForm({
  mode = "create",
  branch,
  onSubmit,
  isLoading = false,
  onModeChange,
  handleDelete,
  shop,
}) {
  const { t } = useTranslation();
  const formSchema = useMemo(() => buildBranchFormSchema(t), [t]);
  const { hasShopPermission } = useShopPermissions();
  const canManage = hasShopPermission(PERM.BRANCH_MANAGE);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: branch || {
      name: "",
      address: "",
      phone: "",
      countryCode: shop?.countryCode ?? "VN",
      taxRegistrationNumber: "",
      wifiSsid: "",
      wifiPassword: "",
      invoiceLocale: "vi",
      isDefault: false,
      active: true,
    },
  });

  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (!branch) return;
    reset({
      name: branch.name ?? "",
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      countryCode: shop?.countryCode || "VN",
      openingDate: branch.openingDate
        ? new Date(branch.openingDate)
        : undefined,
      openingTime: toTimeInputValue(branch.openingTime),
      closingTime: toTimeInputValue(branch.closingTime),
      managerName: branch.managerName ?? "",
      managerPhone: branch.managerPhone ?? "",
      capacity: branch.capacity ?? undefined,
      description: branch.description ?? "",
      taxRegistrationNumber: branch.taxRegistrationNumber ?? "",
      wifiSsid: branch.wifiSsid ?? "",
      wifiPassword: branch.wifiPassword ?? "",
      invoiceLocale:
        branch.invoiceLocale === "en" || branch.invoiceLocale?.startsWith?.("en")
          ? "en"
          : "vi",
      isDefault: branch.default ?? false,
      active: branch.active !== false,
    });
  }, [branch, reset, shop?.countryCode]);

  const country =
    COUNTRIES.find((c) => c.code === form.watch("countryCode")) || COUNTRIES[0];
  const isReadOnly = mode === "view";

  const ReadOnlyValue = ({
    value,
    variant = "single", // "single" | "multi"
    className,
  }) => {
    const text = value ?? "-";

    const textClass =
      variant === "multi"
        ? "whitespace-pre-line break-words line-clamp-3"
        : "truncate whitespace-nowrap";

    return (
      <div
        className={cn(
          "flex justify-between gap-2 rounded-md border border-input bg-muted/50 px-3.5 text-sm text-foreground",
          variant === "multi"
            ? "min-h-[5rem] items-start py-2.5"
            : "min-h-10 h-10 items-center",
          className,
        )}
      >
        <div className={cn("min-w-0 flex-1", textClass)}>{text}</div>

        {value && (
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("pages.branches.form.copy")}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard
                .writeText(String(value))
                .then(() => toast.success(t("pages.branches.form.copied")))
                .catch(() => toast.error(t("pages.branches.form.copyFail")));
            }}
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const handleSubmit = (data) => {
    const trimmedMst = data.taxRegistrationNumber?.trim?.() ?? "";
    const wifiSsid = data.wifiSsid?.trim?.() ?? "";
    const wifiPassword = data.wifiPassword?.trim?.() ?? "";
    const toLocalTimePayload = (t) => {
      const s = typeof t === "string" ? t.trim() : "";
      if (!s) return undefined;
      const m = s.match(/^(\d{2}):(\d{2})$/);
      if (m) return `${m[1]}:${m[2]}:00`;
      return s;
    };
    const submitData = {
      ...data,
      openingDate: data.openingDate
        ? data.openingDate.toISOString().split("T")[0]
        : undefined,
      openingTime: toLocalTimePayload(data.openingTime),
      closingTime: toLocalTimePayload(data.closingTime),
      taxRegistrationNumber: trimmedMst || null,
      wifiSsid: wifiSsid || null,
      wifiPassword: wifiPassword || null,
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full min-h-0 flex flex-col gap-8"
      >
        <div className="flex gap-8 items-start justify-center w-full">
          <div className="flex flex-col gap-7 w-full md:max-w-2xl">
            {/* Tên chi nhánh */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.branches.form.name")} *
                  </FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value} />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder={t("pages.branches.form.namePlaceholder")}
                        className="h-10 px-3.5 py-2"
                        {...field}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quốc gia & Số điện thoại */}
            <div className="grid grid-cols-1 items-start gap-x-4 gap-y-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={() => (
                  <FormItem className="min-w-0">
                    <FormLabel>{t("pages.branches.form.country")}</FormLabel>
                    <FormControl>
                      <div className="flex min-h-9 items-center gap-3">
                        <img
                          src={getFlagUrl(country.code)}
                          alt={country.name}
                          className="h-5 w-8 shrink-0 rounded-sm object-cover ring-1 ring-border"
                        />
                        <ReadOnlyValue
                          value={`${country.name} (${country.dialCode})`}
                          className="min-w-0 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>
                      {t("pages.branches.form.phone")} *
                    </FormLabel>
                    {isReadOnly ? (
                      <FormControl>
                        <ReadOnlyValue
                          value={`${country.dialCode} ${field.value || "-"}`}
                        />
                      </FormControl>
                    ) : (
                      <div
                        className={cn(
                          "flex min-h-10 w-full min-w-0 rounded-md border bg-background transition-[color,box-shadow]",
                          fieldState.error
                            ? "border-destructive ring-2 ring-destructive/25"
                            : "border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/35",
                        )}
                      >
                        <span
                          className="flex min-h-10 shrink-0 items-center border-r border-input bg-muted/80 px-3.5 text-sm tabular-nums text-muted-foreground"
                          aria-hidden
                        >
                          {country.dialCode}
                        </span>
                        <FormControl>
                          <Input
                            placeholder={t("pages.branches.form.phonePlaceholder")}
                            className="h-10 min-h-10 flex-1 min-w-0 rounded-none border-0 bg-transparent px-3.5 py-2 shadow-none focus-visible:ring-0 focus-visible:border-0 focus-visible:outline-none md:text-sm"
                            inputMode="tel"
                            autoComplete="tel"
                            {...field}
                          />
                        </FormControl>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Địa chỉ */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.branches.form.address")} *
                  </FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value} variant="multi" />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t("pages.branches.form.addressPlaceholder")}
                        className="min-h-[88px] px-3.5 py-2.5 text-sm md:text-sm"
                        {...field}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages.branches.form.taxOptional")}</FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value || "-"} />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder={t("pages.branches.form.taxPlaceholder")}
                        maxLength={32}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  )}
                  {!isReadOnly && (
                    <FormDescription>
                      {t("pages.branches.form.taxHint")}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Ngày khai trương */}
              <FormField
                control={form.control}
                name="openingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("pages.branches.form.openingDate")}</FormLabel>
                    {isReadOnly ? (
                      <FormControl>
                        <ReadOnlyValue
                          value={
                            field.value
                              ? format(field.value, "dd/MM/yyyy")
                              : "-"
                          }
                        />
                      </FormControl>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>{t("pages.branches.form.pickDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="p-0 min-w-[280px]"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            className="w-full rounded-md"
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Sức chứa & Mô tả */}
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.branches.form.capacity")}</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input
                        type="number"
                        placeholder={t("pages.branches.form.capacityPlaceholder")}
                        {...field}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Giờ mở / đóng cửa — Popover 24h, không dùng input[type=time] (native UI chồng field) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="openingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.branches.form.openingTime")}</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value || "-"} />
                    ) : (
                      <FormControl>
                        <BranchTimePopover
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.branches.form.closingTime")}</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value || "-"} />
                    ) : (
                      <FormControl>
                        <BranchTimePopover
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quản lý chi nhánh */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.branches.form.managerName")}</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input
                        placeholder={t(
                          "pages.branches.form.managerNamePlaceholder",
                        )}
                        {...field}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="managerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages.branches.form.managerPhone")}</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input
                        placeholder={t(
                          "pages.branches.form.managerPhonePlaceholder",
                        )}
                        {...field}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mô tả — đặt trước Wi‑Fi để luôn thấy rõ; full width */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.branches.form.descriptionOptional")}
                  </FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} variant="multi" />
                  ) : (
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t("pages.branches.form.descriptionPlaceholder")}
                        className="min-h-[100px] px-3.5 py-2.5 text-sm md:text-sm"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-5 space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Wifi className="h-4 w-4 shrink-0" />
                  {t("pages.branches.form.wifiSectionTitle")}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("pages.branches.form.wifiSectionHint")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <FormField
                  control={form.control}
                  name="wifiSsid"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-foreground">
                        {t("pages.branches.form.wifiSsid")}
                      </FormLabel>
                      {isReadOnly ? (
                        <FormControl>
                          <ReadOnlyValue value={field.value} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <Input
                            placeholder={t("pages.branches.form.wifiSsidPlaceholder")}
                            maxLength={64}
                            className="h-10 px-3.5"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wifiPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-foreground">
                        {t("pages.branches.form.wifiPassword")}
                      </FormLabel>
                      {isReadOnly ? (
                        <FormControl>
                          <ReadOnlyValue value={field.value} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t(
                              "pages.branches.form.wifiPasswordPlaceholder",
                            )}
                            maxLength={128}
                            autoComplete="new-password"
                            className="h-10 px-3.5"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="invoiceLocale"
                render={({ field }) => (
                  <FormItem className="space-y-2 max-w-md">
                    <FormLabel className="text-foreground">
                      {t("pages.branches.form.invoiceLocale")}
                    </FormLabel>
                    <FormDescription>
                      {t("pages.branches.form.invoiceLocaleHint")}
                    </FormDescription>
                    {isReadOnly ? (
                      <FormControl>
                        <ReadOnlyValue
                          value={t(
                            `pages.branches.form.invoiceLocaleOption.${field.value || "vi"}`,
                          )}
                        />
                      </FormControl>
                    ) : (
                      <Select
                        value={field.value || "vi"}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INVOICE_LOCALES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {t(
                                `pages.branches.form.invoiceLocaleOption.${code}`,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-2">
          {mode === "view" ? (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => history.back()}
              >
                {t("pages.branches.form.back")}
              </Button>
              {handleDelete && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {t("pages.branches.form.delete")}
                </Button>
              )}
              {canManage && (
                <Button
                  variant="warning"
                  type="button"
                  onClick={() => onModeChange?.("edit")}
                >
                  {t("pages.branches.form.edit")}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  mode === "create" ? history.back() : onModeChange?.("view")
                }
              >
                {t("pages.branches.form.cancel")}
              </Button>
              {canManage && (
              <Button
                variant={mode === "edit" ? "warning" : "success"}
                type="submit"
                disabled={isLoading || !isDirty}
              >
                {isLoading
                  ? t("pages.branches.form.processing")
                  : mode === "edit"
                  ? t("pages.branches.form.update")
                  : t("pages.branches.form.create")}
              </Button>
              )}
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
