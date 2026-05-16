import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BranchForm from "./BranchForm.jsx";
import axiosInstance from "../../api/axiosInstance.js";
import { useShop } from "../../hooks/useShop.js";

export default function BranchFormModal() {
  const navigate = useNavigate();
  const { selectedShop } = useShop();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    if (!selectedShop?.id) return;
    try {
      setLoading(true);
      await axiosInstance.post("/branches", formData, {
        params: { shopId: selectedShop.id },
      });
      navigate("/branches", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => navigate(-1)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("pages.branches.create.title")}</DialogTitle>
        </DialogHeader>
        <BranchForm onSubmit={handleSubmit} isLoading={loading} shop={selectedShop} />
      </DialogContent>
    </Dialog>
  );
}
