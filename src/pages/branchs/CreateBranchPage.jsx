"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { toast } from "sonner";
import BranchForm from "./BranchForm";

export default function CreateBranchPage() {
  const { t } = useTranslation();
  const { selectedShop } = useShop();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    if (!selectedShop) {
      toast.error(t("pages.branches.create.selectShopFirst"));
      return;
    }

    try {
      setIsLoading(true);
      const res = await axiosInstance.post(
        `branches?shopId=${selectedShop.id}`,
        data,
      );

      if (res.data.success) {
        toast.success(t("pages.branches.create.success"));
        navigate(-1);
      } else {
        toast.error(res.data.message || t("pages.branches.create.fail"));
      }
    } catch (err) {
      console.error("Create branch error:", err);
      toast.error(t("pages.branches.create.fail"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="font-medium text-2xl">
          {t("pages.branches.create.title")}
        </div>
        <BranchForm
          mode="create"
          onSubmit={onSubmit}
          isLoading={isLoading}
          shop={selectedShop}
        />
      </div>
    </div>
  );
}
