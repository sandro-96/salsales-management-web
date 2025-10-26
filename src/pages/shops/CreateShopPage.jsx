"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import ShopForm from "./ShopForm";

export default function CreateShopPage() {
  const { enums } = useAuth();
  const { fetchShops } = useShop();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // --- Submit ---
  const onSubmit = async (data, file) => {
    try {
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
        toast.success("Tạo cửa hàng thành công.");
        await fetchShops();
        navigate(-1);
      } else {
        toast.error("Đã xảy ra lỗi khi tạo cửa hàng.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo cửa hàng:", err);
      toast.error("Đã xảy ra lỗi khi tạo cửa hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full w-full">
      <ShopForm
        mode="create"
        enums={enums}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
