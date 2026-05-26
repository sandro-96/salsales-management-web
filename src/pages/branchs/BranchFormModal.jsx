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
import { useShop } from "../../hooks/useShop.js";
import { createBranch } from "@/api/branchApi";

export default function BranchFormModal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedShop } = useShop();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    if (!selectedShop?.id) return;
    try {
      setLoading(true);
      await createBranch(selectedShop.id, data);
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
