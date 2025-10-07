import React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BranchForm({ onSubmit, defaultValues, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      name: "",
      address: "",
      phone: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Tên chi nhánh */}
      <div>
        <label className="block text-sm font-medium mb-1">Tên chi nhánh</label>
        <Input
          {...register("name", { required: "Tên chi nhánh là bắt buộc" })}
          placeholder="Nhập tên chi nhánh"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Địa chỉ */}
      <div>
        <label className="block text-sm font-medium mb-1">Địa chỉ</label>
        <Input {...register("address")} placeholder="Nhập địa chỉ" />
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-medium mb-1">Số điện thoại</label>
        <Input
          {...register("phone", {
            pattern: {
              value: /^[0-9\-\+\s()]*$/,
              message: "Số điện thoại không hợp lệ",
            },
          })}
          placeholder="Nhập số điện thoại"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu chi nhánh"}
      </Button>
    </form>
  );
}
