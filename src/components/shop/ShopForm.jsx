"use client";

import { useState, useEffect } from "react";
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
import { isDirty } from "zod/v3";
import { m } from "framer-motion";

const formSchema = z
  .object({
    name: z.string().min(1, "Tên cửa hàng không được để trống."),
    type: z.string(),
    address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự."),
    phone: z.string().min(1, "Số điện thoại không được để trống."),
    countryCode: z.string(),
    businessModel: z.string(),
  })
  .superRefine((data, ctx) => {
    const countryInfo = COUNTRIES.find((c) => c.code === data.countryCode);
    if (countryInfo && !countryInfo.phonePattern.test(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Số điện thoại không hợp lệ cho ${countryInfo.name}`,
        path: ["phone"],
      });
    }
  });

export default function ShopForm({
  mode = "create",
  shop,
  enums,
  onSubmit,
  isLoading,
  onModeChange,
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: shop || {
      name: "",
      type: "RESTAURANT",
      address: "",
      phone: "",
      countryCode: "VN",
      businessModel: "DINE_IN",
    },
  });
  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
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
    shop?.logoUrl
      ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${
          shop.logoUrl
        }`
      : null
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
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const toastId = toast.loading("Ảnh vượt quá 5MB. Đang nén ảnh...");
      try {
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        toast.success("Nén ảnh thành công!", { id: toastId });
        setFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch {
        toast.error("Nén ảnh thất bại.", { id: toastId });
      }
      return;
    }

    setFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
    toast.success("Ảnh đã sẵn sàng!");
  };

  // --- Submit handler ---
  const handleSubmit = (data) => {
    if (onSubmit) onSubmit(data, file);
  };

  // -----------------------
  // Read-only small component
  // -----------------------
  const ReadOnlyValue = ({ value, className = "min-h-[2.75rem]" }) => {
    const text = value ?? "-";
    return (
      <div
        className={`border border-gray-200 rounded-md bg-gray-50 px-3 py-2 text-gray-800 flex items-center justify-between ${className}`}
      >
        <div className="truncate break-words text-sm">{text}</div>
        {value && (
          <Copy
            className="w-4 h-4 ml-3 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              try {
                navigator.clipboard.writeText(String(value));
                toast.success("Đã sao chép!");
              } catch {
                toast.error("Không thể sao chép");
              }
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
        <div className="font-medium text-2xl">
          {mode === "create"
            ? "Tạo cửa hàng"
            : mode === "edit"
            ? "Chỉnh sửa cửa hàng"
            : "Thông tin cửa hàng"}
        </div>

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
                      Logo cửa hàng{" "}
                      {!isReadOnly && (
                        <span className="text-xs text-gray-500">
                          (JPG, PNG, WEBP tối đa 5MB)
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
                              }}
                              className="text-xs"
                            >
                              Xóa ảnh
                            </Button>
                          )}
                          {!isReadOnly && (
                            <Button
                              variant="outline"
                              type="button"
                              className="relative overflow-hidden text-xs"
                            >
                              {imagePreview
                                ? "Tải ảnh khác"
                                : "Tải logo cửa hàng"}
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
                      <FormLabel>Tên cửa hàng</FormLabel>
                      <FormControl>
                        <ReadOnlyValue value={form.getValues("name")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }
                return (
                  <FormItem>
                    <FormLabel>Tên cửa hàng</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Nhập tên cửa hàng"
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
                    const label =
                      shopTypes.find((s) => s.value === value)?.label ||
                      value ||
                      "-";
                    return (
                      <FormItem>
                        <FormLabel>Loại hình kinh doanh</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={label} />
                        </FormControl>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>Loại hình kinh doanh</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const selectedType = shopTypes.find(
                              (s) => s.value === value
                            );
                            field.onChange(value);
                            form.setValue(
                              "businessModel",
                              selectedType?.defaultBusinessModel || "DINE_IN"
                            );
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn loại hình" />
                          </SelectTrigger>
                          <SelectContent>
                            {shopTypes.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    const label =
                      businessModels.find((b) => b.value === value)?.label ||
                      value ||
                      "-";
                    return (
                      <FormItem>
                        <FormLabel>Mô hình kinh doanh</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={label} />
                        </FormControl>
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>Mô hình kinh doanh</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn mô hình" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessModels.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                        <FormLabel>Quốc gia</FormLabel>
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
                      <FormLabel>Quốc gia</FormLabel>
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
                                      (c) => c.code === field.value
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
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <ReadOnlyValue value={display} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }

                  return (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="px-3 py-2 bg-gray-200 border border-r-0 rounded-l-md text-gray-700 text-xs">
                            {country.dialCode}
                          </span>
                          <Input
                            aria-invalid={!!fieldState.error}
                            placeholder="Nhập số điện thoại"
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
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <ReadOnlyValue value={form.getValues("address")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                return (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập địa chỉ chi tiết"
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
                Quay lại
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
                Chỉnh sửa
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
                Hủy
              </Button>
              <Button
                variant={mode === "edit" ? "warning" : "success"}
                type="submit"
                disabled={isLoading || !isDirty}
                className="w-fit"
              >
                {isLoading
                  ? "Đang xử lý..."
                  : mode === "edit"
                  ? "Cập nhật"
                  : "Tạo cửa hàng"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
