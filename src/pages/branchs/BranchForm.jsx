"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Copy, Calendar as CalendarIcon } from "lucide-react";
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
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: branch || {
      name: "",
      address: "",
      phone: "",
      countryCode: shop?.countryCode ?? "VN",
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
      });
    }
  }, [branch, reset, shop]);

  const country =
    COUNTRIES.find((c) => c.code === form.watch("countryCode")) || COUNTRIES[0];
  const isReadOnly = mode === "view";

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
                .then(() => toast.success("Đã sao chép!"))
                .catch(() => toast.error("Không thể sao chép"));
            }}
          />
        )}
      </div>
    );
  };

  const handleSubmit = (data) => {
    // Chuyển openingDate về string ISO nếu cần (tùy backend)
    const submitData = {
      ...data,
      openingDate: data.openingDate
        ? data.openingDate.toISOString().split("T")[0]
        : undefined,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quốc gia</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <img
                          src={getFlagUrl(country.code)}
                          alt={country.name}
                          className="w-8 h-5 rounded-sm"
                        />
                        <ReadOnlyValue
                          value={`${country.name} (${country.dialCode})`}
                          className="flex-1"
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
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    {isReadOnly ? (
                      <FormControl>
                        <ReadOnlyValue
                          value={`${country.dialCode} ${field.value || "-"}`}
                        />
                      </FormControl>
                    ) : (
                      <FormControl>
                        <div className="flex">
                          <span className="px-3 py-1 bg-gray-200 border border-r-0 rounded-l-md text-gray-700 text-sm">
                            {country.dialCode}
                          </span>
                          <Input
                            placeholder="Nhập số điện thoại"
                            className="rounded-l-none"
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
              <Button
                variant="warning"
                type="button"
                onClick={() => onModeChange?.("edit")}
              >
                Chỉnh sửa
              </Button>
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
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
