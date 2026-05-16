"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { ImagePlus, Copy } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COUNTRIES } from "@/constants/countries";
import { getFlagUrl } from "@/utils/commonUtils";
import {
  getBusinessModelLabel,
  getShopTypeLabel,
} from "@/utils/shopLabels";

function buildShopFormSchema(t) {
  return z
    .object({
      name: z.string().min(1, t("pages.shops.form.nameRequired")),
      type: z.string(),
      address: z.string().min(10, t("pages.shops.form.addressMin")),
      phone: z.string().min(1, t("pages.shops.form.phoneRequired")),
      countryCode: z.string(),
      businessModel: z.string(),
      taxRegistrationNumber: z.string().max(32, t("pages.shops.form.taxMax")),
    })
    .superRefine((data, ctx) => {
      const countryInfo = COUNTRIES.find((c) => c.code === data.countryCode);
      if (countryInfo && !countryInfo.phonePattern.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("pages.shops.form.phoneInvalid", { country: countryInfo.name }),
          path: ["phone"],
        });
      }
    });
}

export default function ShopForm({
  mode = "create",
  shop,
  enums,
  onSubmit,
  isLoading,
  onModeChange,
  handleDelete,
}) {
  const { t } = useTranslation();
  const formSchema = useMemo(() => buildShopFormSchema(t), [t]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: shop || {
      name: "",
      type: "RESTAURANT",
      address: "",
      phone: "",
      countryCode: "VN",
      businessModel: "DINE_IN",
      taxRegistrationNumber: "",
    },
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    setImagePreview(shop?.logoUrl ? shop.logoUrl : null);
    if (mode === "view") {
      reset(shop);
    } else if (mode === "edit") {
      reset(form.getValues());
    }
  }, [mode, shop, reset, form]);

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    shop?.logoUrl ? shop.logoUrl : null,
  );
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const country =
    COUNTRIES.find((c) => c.code === form.watch("countryCode")) || COUNTRIES[0];

  const isReadOnly = mode === "view";

  // --- handle file ---
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const MAX_FILE_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error(t("pages.shops.form.imageTypeError"));
      return;
    }

    let processedFile = selectedFile;
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const toastId = toast.loading(t("pages.shops.form.compressing"));
      try {
        processedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        toast.success(t("pages.shops.form.compressSuccess"), { id: toastId });
      } catch {
        toast.error(t("pages.shops.form.compressFail"), { id: toastId });
      }
    }

    // 👉 Cập nhật cả React state và form
    setFile(processedFile);
    setImagePreview(URL.createObjectURL(processedFile));

    // Cập nhật vào react-hook-form
    form.setValue("logo", processedFile, { shouldDirty: true });

    toast.success(t("pages.shops.form.imageReady"));
  };

  // --- Submit handler ---
  const handleSubmit = (data) => {
    const payload = {
      ...data,
      taxRegistrationNumber: data.taxRegistrationNumber?.trim() || null,
    };
    if (onSubmit) onSubmit(payload, file);
  };

  // -----------------------
  // Read-only small component
  // -----------------------
  const ReadOnlyValue = ({
    value,
    variant = "single", // "single" | "multi"
    className = "min-h-[2.75rem]",
  }) => {
    const text = value ?? "-";

    const textClass =
      variant === "multi"
        ? "whitespace-pre-line break-words line-clamp-3"
        : "truncate whitespace-nowrap";

    return (
      <div
        className={`border border-gray-200 rounded-md bg-gray-50 px-3 py-2 text-gray-800 flex items-center justify-between gap-2 ${className}`}
      >
        <div className={`text-sm ${textClass}`}>{text}</div>

        {value && (
          <Copy
            className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard
                .writeText(String(value))
                .then(() => toast.success(t("pages.shops.form.copySuccess")))
                .catch(() => toast.error(t("pages.shops.form.copyFail")));
            }}
          />
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full h-full flex flex-col gap-6"
      >
        <div className="flex gap-8 grow-1 items-start justify-center w-full">
          <div className="flex flex-col gap-6 w-full md:max-w-lg">
            {/* logo upload */}
            <div className="flex flex-col items-center gap-2">
              <FormField
                control={form.control}
                name="logo"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>
                      {t("pages.shops.form.logoLabel")}{" "}
                      {!isReadOnly && (
                        <span className="text-xs text-gray-500">
                          {t("pages.shops.form.logoHint")}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="size-24 rounded-lg border-b-blue-700 border-2">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Logo preview"
                              className="size-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="rounded-lg">
                              <ImagePlus className="w-8 h-8 text-gray-400" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {/* remove and upload new logo */}
                        <div className="flex gap-2">
                          {imagePreview && !isReadOnly && (
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                setFile(null);
                                setImagePreview(null);
                                setFileInputKey(Date.now());
                                form.setValue("logo", null, {
                                  shouldDirty: true,
                                });
                              }}
                              className="text-xs"
                            >
                              {t("pages.shops.form.removeImage")}
                            </Button>
                          )}
                          {!isReadOnly && (
                            <Button
                              variant="outline"
                              type="button"
                              className="relative overflow-hidden text-xs"
                            >
                              {imagePreview
                                ? t("pages.shops.form.uploadOther")
                                : t("pages.shops.form.uploadLogo")}
                              <input
                                key={fileInputKey}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                                className="absolute inset-0 cursor-pointer opacity-0"
                              />
                            </Button>
                          )}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Tên cửa hàng */}
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => {
                if (isReadOnly) {
                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.shopName")}</FormLabel>
                      <FormControl>
                        <ReadOnlyValue value={form.getValues("name")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }
                return (
                  <FormItem>
                    <FormLabel>{t("pages.shops.form.shopNameRequired")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t("pages.shops.form.shopNamePlaceholder")}
                          aria-invalid={!!fieldState.error}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Loại hình & Mô hình */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => {
                  if (isReadOnly) {
                    const value = form.getValues("type");
                    const hit = shopTypes.find((s) => s.value === value);
                    const label =
                      getShopTypeLabel(t, value, hit?.label) || "-";
                    return (
                      <FormItem>
                        <FormLabel>{t("pages.shops.form.businessType")}</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={label} />
                        </FormControl>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.businessType")}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const selectedType = shopTypes.find(
                              (s) => s.value === value,
                            );
                            field.onChange(value);
                            form.setValue(
                              "businessModel",
                              selectedType?.defaultBusinessModel || "DINE_IN",
                            );
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("pages.shops.form.selectType")} />
                          </SelectTrigger>
                          <SelectContent>
                            {shopTypes.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {getShopTypeLabel(t, opt.value, opt.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="businessModel"
                render={({ field }) => {
                  if (isReadOnly) {
                    const value = form.getValues("businessModel");
                    const hit = businessModels.find((b) => b.value === value);
                    const label =
                      getBusinessModelLabel(t, value, hit?.label) || "-";
                    return (
                      <FormItem>
                        <FormLabel>{t("pages.shops.form.businessModel")}</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={label} />
                        </FormControl>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.businessModel")}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("pages.shops.form.selectModel")} />
                          </SelectTrigger>
                          <SelectContent>
                            {businessModels.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {getBusinessModelLabel(t, opt.value, opt.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              {/* Quốc gia */}
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => {
                  if (isReadOnly) {
                    const value = form.getValues("countryCode") || "VN";
                    const c =
                      COUNTRIES.find((cc) => cc.code === value) || COUNTRIES[0];
                    return (
                      <FormItem>
                        <FormLabel>{t("pages.shops.form.country")}</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <img
                              src={getFlagUrl(c.code)}
                              alt={c.name}
                              className="w-6 h-4 rounded-sm object-cover"
                            />
                            <ReadOnlyValue
                              value={`${c.name} (${c.dialCode})`}
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.country")}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <img
                                  src={getFlagUrl(field.value)}
                                  alt="flag"
                                  className="w-5 h-4 rounded-sm"
                                />
                                <span>
                                  {
                                    COUNTRIES.find(
                                      (c) => c.code === field.value,
                                    )?.name
                                  }
                                </span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                                onSelect={() => field.onChange(country.code)}
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getFlagUrl(country.code)}
                                    alt={country.name}
                                    className="w-5 h-4 rounded-sm object-cover"
                                  />
                                  <span>
                                    {country.name} ({country.dialCode})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              {/* Số điện thoại */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => {
                  if (isReadOnly) {
                    const val = form.getValues("phone");
                    const display = `${country.dialCode} ${val || "-"}`;
                    return (
                      <FormItem>
                        <FormLabel>{t("pages.shops.form.phone")}</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={display} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.phoneRequired")}</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="px-3 py-2 bg-gray-200 border border-r-0 rounded-l-md text-gray-700 text-xs">
                            {country.dialCode}
                          </span>
                          <Input
                            aria-invalid={!!fieldState.error}
                            placeholder={t("pages.shops.form.phonePlaceholder")}
                            className="flex-1 rounded-l-none"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Địa chỉ */}
            <FormField
              control={form.control}
              name="address"
              render={({ field, fieldState }) => {
                if (isReadOnly) {
                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.form.address")}</FormLabel>
                      <FormControl>
                        <ReadOnlyValue
                          value={form.getValues("address")}
                          variant="multi"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                return (
                  <FormItem>
                    <FormLabel>{t("pages.shops.form.addressRequired")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("pages.shops.form.addressPlaceholder")}
                        rows={3}
                        aria-invalid={!!fieldState.error}
                        {...field}
                      ></Textarea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="taxRegistrationNumber"
              render={({ field, fieldState }) => {
                if (isReadOnly) {
                  return (
                    <FormItem>
                      <FormLabel>{t("pages.shops.settings.taxId")}</FormLabel>
                      <FormControl>
                        <ReadOnlyValue
                          value={form.getValues("taxRegistrationNumber")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }
                return (
                  <FormItem>
                    <FormLabel>{t("pages.shops.form.taxOptional")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("pages.shops.form.taxPlaceholder")}
                        maxLength={32}
                        aria-invalid={!!fieldState.error}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {mode === "view" ? (
            <>
              <Button
                variant="outline"
                type="button"
                className="w-fit"
                onClick={() => history.back()}
              >
                {t("pages.shops.form.back")}
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={() => handleDelete()}
                disabled={isLoading}
              >
                {t("pages.shops.form.delete")}
              </Button>
              <Button
                variant="warning"
                type="button"
                className="w-fit"
                onClick={(e) => {
                  e.preventDefault();
                  onModeChange("edit");
                }}
              >
                {t("pages.shops.form.edit")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                type="button"
                className="w-fit"
                onClick={() => {
                  mode === "create" ? history.back() : onModeChange("view");
                }}
              >
                {t("pages.shops.form.cancel")}
              </Button>
              <Button
                variant={mode === "edit" ? "warning" : "success"}
                type="submit"
                disabled={isLoading || !isDirty}
                className="w-fit"
              >
                {isLoading
                  ? t("pages.shops.form.processing")
                  : mode === "edit"
                    ? t("pages.shops.form.update")
                    : t("pages.shops.form.createShop")}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
