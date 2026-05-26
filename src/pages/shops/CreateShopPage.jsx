"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import ShopForm from "../../components/shop/ShopForm";

export default function CreateShopPage() {
  const { t } = useTranslation();
  const { enums } = useAuth();
  const { fetchShops } = useShop();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data, file) => {
    try {
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
        "shop.json",
      );
      if (file) formData.append("file", file, file.name || "shop-logo.jpg");

      setIsLoading(true);
      const res = await axiosInstance.post("/shop", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success(t("pages.shops.create.success"));
        const createdId = res.data.data?.id;
        await fetchShops(createdId);
        navigate("/shops", { replace: true });
      } else {
        toast.error(res.data.message || t("pages.shops.create.fail"));
      }
    } catch (err) {
      console.error("Create shop error:", err);
      toast.error(t("pages.shops.create.fail"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="font-medium text-2xl">{t("pages.shops.create.title")}</div>
        <ShopForm
          mode="create"
          enums={enums}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
