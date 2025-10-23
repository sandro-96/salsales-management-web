"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";

import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import { COUNTRIES } from "../../constants/countries";
import LoadingOverlay from "../../components/loading/LoadingOverlay";

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

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, "Tên cửa hàng không được để trống."),
  type: z.string(),
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự."),
  phone: z.string(),
  countryCode: z.string(),
  businessModel: z.string(),
});

export default function CreateShopPage() {
  const { enums } = useAuth();
  const { fetchShops } = useShop();
  const navigate = useNavigate();
  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "RESTAURANT",
      address: "",
      phone: "",
      countryCode: "VN",
      businessModel: "DINE_IN",
    },
  });

  const country =
    COUNTRIES.find((c) => c.code === form.watch("countryCode")) || COUNTRIES[0];

  // --- Xử lý file upload ---
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
      setSubmitError("Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSubmitError(
        `Ảnh vượt quá ${MAX_FILE_SIZE_MB}MB. Đang tiến hành nén ảnh...`
      );
      try {
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        setFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        setSubmitError("");
      } catch (err) {
        console.error("Lỗi khi nén ảnh:", err);
        setSubmitError("Nén ảnh thất bại. Vui lòng chọn ảnh nhỏ hơn.");
        return;
      }
    } else {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setSubmitError("");
    }
  };

  // --- Submit ---
  const onSubmit = async (data) => {
    try {
      const countryInfo = COUNTRIES.find((c) => c.code === data.countryCode);
      if (countryInfo && !countryInfo.phonePattern.test(data.phone)) {
        form.setError("phone", {
          type: "manual",
          message: `Số điện thoại không hợp lệ cho ${countryInfo.name}`,
        });
        return;
      }

      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" })
      );
      if (file) formData.append("file", file);

      setIsLoading(true);
      const res = await axiosInstance.post("/shop", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        await fetchShops();
        navigate(-1);
      } else {
        setSubmitError(res.data.message || "Tạo cửa hàng thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo cửa hàng:", err);
      setSubmitError(
        err.response?.data?.message || "Đã xảy ra lỗi khi gửi dữ liệu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  function getFlagUrl(code) {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  }

  return (
    <div className="p-6 h-full w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full h-full flex flex-col gap-6"
        >
          {isLoading && <LoadingOverlay text="Đang tạo cửa hàng..." />}
          <div className="font-medium text-2xl">Tạo cửa hàng</div>
          <div className="flex gap-8 grow-1">
            <div className="flex flex-col gap-6 w-full">
              {/* Tên cửa hàng */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên cửa hàng</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Nhập tên cửa hàng" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Loại hình & Mô hình */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessModel"
                  render={({ field }) => (
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
                  )}
                />
                {/* Quốc gia */}
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
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
                  )}
                />
                {/* Số điện thoại */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="px-3 py-2 bg-gray-200 border border-r-0 rounded-l-md text-gray-700 text-xs">
                            {country.dialCode}
                          </span>
                          <Input
                            placeholder="Nhập số điện thoại"
                            className="flex-1 rounded-l-none"
                            {...field}
                          />
                        </div>
                      </FormControl>
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
                    <FormControl>
                      <Textarea
                        placeholder="Nhập địa chỉ chi tiết"
                        rows={3}
                        {...field}
                      ></Textarea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              {/* logo upload */}
              <div className="flex flex-col items-center gap-2">
                <FormField
                  control={form.control}
                  name="logo"
                  render={() => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Logo cửa hàng{" "}
                        <span className="text-xs text-gray-500">
                          (JPG, PNG, WEBP tối đa 5MB)
                        </span>
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
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {/* remove and upload new logo */}
                          <div className="flex gap-2">
                            {imagePreview && (
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  setFile(null);
                                  setImagePreview(null);
                                  setFileInputKey(Date.now());
                                }}
                                className="text-xs cursor-pointer"
                              >
                                Xóa ảnh
                              </Button>
                            )}
                            <Button variant="outline" type="button">
                              <label className="text-xs cursor-pointer">
                                {imagePreview
                                  ? "Tải ảnh khác"
                                  : "Tải logo cửa hàng"}
                                <input
                                  key={fileInputKey}
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                              </label>
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-red-600 text-xs text-center">{submitError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              className="w-fit"
              onClick={() => navigate(-1)}
            >
              Hủy
            </Button>
            <Button variant="info" type="submit" className="w-fit">
              {isLoading ? "Đang xử lý..." : "Tạo cửa hàng"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
