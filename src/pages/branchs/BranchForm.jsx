"use client";

import { useEffect } from "react";
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
import { getFlagUrl } from "@/utils/commonUtils";
import { cn } from "@/lib/utils"; // giả sử bạn có utils cn cho className
import { useShopPermissions } from "@/hooks/useShopPermissions.js";
import { PERM } from "@/constants/shopPermissions.js";

const formSchema = z
  .object({
    name: z.string().min(1, "Tên chi nhánh không được để trống."),
    address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự."),
    phone: z.string().min(1, "Số điện thoại không được để trống."),
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
      .max(32, "MST tối đa 32 ký tự.")
      .optional()
      .nullable(),

    wifiSsid: z
      .string()
      .max(64, "Tên Wi‑Fi tối đa 64 ký tự.")
      .optional()
      .nullable(),
    wifiPassword: z
      .string()
      .max(128, "Mật khẩu Wi‑Fi tối đa 128 ký tự.")
      .optional()
      .nullable(),

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
        message: `Số điện thoại không hợp lệ cho ${countryInfo.name}`,
        path: ["phone"],
      });
    }
  });

export default function BranchForm({
  mode = "create",
  branch,
  onSubmit,
  isLoading = false,
  onModeChange,
  handleDelete,
  shop,
}) {
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
      isDefault: false,
      active: true,
    },
  });

  const {
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (branch) {
      reset({
        ...branch,
        openingDate: branch.openingDate
          ? new Date(branch.openingDate)
          : undefined,
        capacity: branch.capacity ?? undefined,
        countryCode: shop?.countryCode || "VN",
        taxRegistrationNumber: branch.taxRegistrationNumber ?? "",
        wifiSsid: branch.wifiSsid ?? "",
        wifiPassword: branch.wifiPassword ?? "",
      });
    }
  }, [branch, reset, shop]);

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
          "flex justify-between gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground",
          variant === "multi"
            ? "min-h-[5rem] items-start py-2"
            : "h-9 items-center",
          className,
        )}
      >
        <div className={cn("min-w-0 flex-1", textClass)}>{text}</div>

        {value && (
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sao chép"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard
                .writeText(String(value))
                .then(() => toast.success("Đã sao chép!"))
                .catch(() => toast.error("Không thể sao chép"));
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
    const submitData = {
      ...data,
      openingDate: data.openingDate
        ? data.openingDate.toISOString().split("T")[0]
        : undefined,
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
        className="w-full h-full flex flex-col gap-6"
      >
        <div className="flex gap-8 items-start justify-center w-full">
          <div className="flex flex-col gap-6 w-full md:max-w-2xl">
            {/* Tên chi nhánh */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chi nhánh</FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value} />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input placeholder="Nhập tên chi nhánh" {...field} />
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
                    <FormLabel>Quốc gia</FormLabel>
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
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Số điện thoại</FormLabel>
                    {isReadOnly ? (
                      <FormControl>
                        <ReadOnlyValue
                          value={`${country.dialCode} ${field.value || "-"}`}
                        />
                      </FormControl>
                    ) : (
                      <FormControl>
                        <div className="flex rounded-md shadow-xs">
                          <span
                            className="flex h-9 shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm tabular-nums text-muted-foreground"
                            aria-hidden
                          >
                            {country.dialCode}
                          </span>
                          <Input
                            placeholder="Nhập số điện thoại"
                            className="rounded-l-none border-l-0 focus-visible:z-10"
                            inputMode="tel"
                            autoComplete="tel"
                            {...field}
                          />
                        </div>
                      </FormControl>
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
                  <FormLabel>Địa chỉ</FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value} variant="multi" />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Nhập địa chỉ chi tiết"
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
                  <FormLabel>Mã số thuế (MST) — tùy chọn</FormLabel>
                  {isReadOnly ? (
                    <FormControl>
                      <ReadOnlyValue value={field.value || "-"} />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="Để trống = dùng MST của cửa hàng"
                        maxLength={32}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  )}
                  {!isReadOnly && (
                    <FormDescription>
                      Chỉ nhập khi chi nhánh đăng ký MST riêng tại địa điểm kinh
                      doanh.
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
                    <FormLabel>Ngày khai trương</FormLabel>
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
                                <span>Chọn ngày</span>
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
                    <FormLabel>Sức chứa (số ghế/bàn)</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input
                        type="number"
                        placeholder="Ví dụ: 100"
                        {...field}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Giờ mở / đóng cửa */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ mở cửa</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value || "-"} />
                    ) : (
                      <Input type="time" {...field} value={field.value || ""} />
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
                    <FormLabel>Giờ đóng cửa</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value || "-"} />
                    ) : (
                      <Input type="time" {...field} value={field.value || ""} />
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
                    <FormLabel>Tên quản lý</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input placeholder="Nhập tên quản lý" {...field} />
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
                    <FormLabel>SĐT quản lý</FormLabel>
                    {isReadOnly ? (
                      <ReadOnlyValue value={field.value} />
                    ) : (
                      <Input placeholder="Nhập số điện thoại" {...field} />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 space-y-4 bg-muted/20">
              <p className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Wi‑Fi khách (in trên hóa đơn)
              </p>
              <p className="text-xs text-muted-foreground -mt-2">
                Nếu nhập, tên mạng và mật khẩu sẽ xuất hiện trên bill in từ POS
                hoặc mục in lại đơn.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wifiSsid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Wi‑Fi (SSID)</FormLabel>
                      {isReadOnly ? (
                        <FormControl>
                          <ReadOnlyValue value={field.value} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: MilkTea_Guest"
                            maxLength={64}
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
                    <FormItem>
                      <FormLabel>Mật khẩu Wi‑Fi</FormLabel>
                      {isReadOnly ? (
                        <FormControl>
                          <ReadOnlyValue value={field.value} />
                        </FormControl>
                      ) : (
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Để trống nếu không có"
                            maxLength={128}
                            autoComplete="new-password"
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
            </div>

            {/* Mô tả */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi nhánh (tùy chọn)</FormLabel>
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} variant="multi" />
                  ) : (
                    <Textarea
                      rows={4}
                      placeholder="Ghi chú đặc điểm chi nhánh..."
                      {...field}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
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
                Quay lại
              </Button>
              {handleDelete && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Xóa
                </Button>
              )}
              {canManage && (
                <Button
                  variant="warning"
                  type="button"
                  onClick={() => onModeChange?.("edit")}
                >
                  Chỉnh sửa
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
                Hủy
              </Button>
              {canManage && (
              <Button
                variant={mode === "edit" ? "warning" : "success"}
                type="submit"
                disabled={isLoading || !isDirty}
              >
                {isLoading
                  ? "Đang xử lý..."
                  : mode === "edit"
                  ? "Cập nhật"
                  : "Tạo chi nhánh"}
              </Button>
              )}
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
