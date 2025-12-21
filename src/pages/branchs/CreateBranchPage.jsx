"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { toast } from "sonner";
import BranchForm from "./BranchForm";

export default function CreateBranchPage() {
  const { selectedShop } = useShop();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    if (!selectedShop) {
      toast.error("Vui lòng chọn cửa hàng trước khi tạo chi nhánh.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post(
        `/shop/${selectedShop.id}/branch`,
        data
      );

      if (res.data.success) {
        toast.success("Tạo chi nhánh thành công.");
        navigate(-1);
      } else {
        toast.error(res.data.message || "Đã xảy ra lỗi khi tạo chi nhánh.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo chi nhánh:", err);
      toast.error("Đã xảy ra lỗi khi tạo chi nhánh.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="font-medium text-2xl">Tạo chi nhánh mới</div>
        <BranchForm mode="create" onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
