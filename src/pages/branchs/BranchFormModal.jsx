import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BranchForm from "./BranchForm.jsx";
import axiosInstance from "../../api/axiosInstance.js";
import { useShop } from "@/hooks/useShop.js";
import { useAlert } from "@/hooks/useAlert.js";
import { ALERT_TYPES } from "@/constants/alertTypes.js";

export default function BranchFormModal() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { selectedShopId } = useShop();
  const shopId = selectedShopId;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      await axiosInstance.post("/branches", formData);
      navigate("/branches", { replace: true });
    } catch (err) {
      showAlert({
        title: "Tạo chi nhánh thất bại",
        description: "Vui lòng thử lại sau",
        type: ALERT_TYPES.ERROR,
        variant: "modal",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => navigate(-1)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Chi nhánh</DialogTitle>
        </DialogHeader>
        <BranchForm onSubmit={handleSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
