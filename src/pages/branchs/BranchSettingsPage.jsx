"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import { toast } from "sonner";
import BranchForm from "./BranchForm";
import { useAlertDialog } from "../../hooks/useAlertDialog";

const BranchSettingsPage = () => {
  const { confirm } = useAlertDialog();
  const { selectedShop, selectedBranch, setSelectedBranch, fetchBranches } =
    useShop(); // giả sử hook có selectedBranch + fetchBranches
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("view");
  const navigate = useNavigate();

  // Nếu không có chi nhánh được chọn
  if (!selectedBranch) {
    return (
      <div className="p-6 h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy chi nhánh.</p>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}/branch/${selectedBranch.id}`,
        data
      );

      if (res.data.success) {
        toast.success("Cập nhật chi nhánh thành công.");
        setSelectedBranch(res.data.data);
        await fetchBranches?.(); // refresh danh sách nếu cần
        setMode("view");
      } else {
        toast.error(res.data.message || "Cập nhật chi nhánh thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật chi nhánh:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm(
      "Bạn có chắc muốn xóa chi nhánh này không? Hành động này không thể hoàn tác.",
      {
        title: "Xóa chi nhánh",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      }
    );

    if (ok) {
      try {
        setIsSubmitting(true);
        const res = await axiosInstance.delete(
          `/shop/${selectedShop.id}/branch/${selectedBranch.id}`
        );

        if (res.data.success) {
          toast.success("Xóa chi nhánh thành công.");
          setSelectedBranch(null);
          await fetchBranches?.();
          navigate(-1);
        } else {
          toast.error(res.data.message || "Xóa chi nhánh thất bại.");
        }
      } catch (err) {
        console.error("Lỗi khi xóa chi nhánh:", err);
        toast.error("Đã xảy ra lỗi khi xóa chi nhánh.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="flex justify-between flex-wrap">
          <div className="font-medium text-2xl">
            {mode === "view"
              ? "Thông tin chi nhánh"
              : mode === "edit"
              ? "Chỉnh sửa chi nhánh"
              : ""}
          </div>
        </div>

        <BranchForm
          mode={mode}
          branch={selectedBranch}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          onModeChange={setMode}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default BranchSettingsPage;
