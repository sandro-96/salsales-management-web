"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import axiosInstance from "../../api/axiosInstance";
import BranchForm from "./BranchForm";
import { useShop } from "../../hooks/useShop";
import { useAlertDialog } from "../../hooks/useAlertDialog";

const BranchSettingsPage = () => {
  const navigate = useNavigate();
  const { confirm } = useAlertDialog();
  const { id } = useParams();

  const { fetchBranches } = useShop();

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("view");

  /* =======================
   * FETCH BRANCH BY ID
   * ======================= */
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);

        const res = await axiosInstance.get(`/branches/${id}`);

        if (res.data.success) {
          setBranch(res.data.data);
        } else {
          toast.error("Không tìm thấy chi nhánh.");
        }
      } catch (err) {
        console.error("Fetch branch error:", err);
        toast.error("Đã xảy ra lỗi khi tải chi nhánh.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBranch();
    }
  }, [id]);

  /* =======================
   * SUBMIT UPDATE
   * ======================= */
  const onSubmit = async (data) => {
    if (!branch) return;

    try {
      setIsSubmitting(true);

      const res = await axiosInstance.put(`branches/${branch.id}`, data);

      if (res.data.success) {
        toast.success("Cập nhật chi nhánh thành công.");
        setBranch(res.data.data);
        await fetchBranches?.();
        setMode("view");
      } else {
        toast.error(res.data.message || "Cập nhật chi nhánh thất bại.");
      }
    } catch (err) {
      console.error("Update branch error:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================
   * DELETE BRANCH
   * ======================= */
  const handleDelete = async () => {
    if (!branch) return;

    const ok = await confirm(
      "Bạn có chắc muốn xóa chi nhánh này không? Hành động này không thể hoàn tác.",
      {
        title: "Xóa chi nhánh",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      }
    );

    if (!ok) return;

    try {
      setIsSubmitting(true);

      const res = await axiosInstance.delete(`branches/${branch.id}`);

      if (res.data.success) {
        toast.success("Xóa chi nhánh thành công.");
        await fetchBranches?.();
        navigate(-1);
      } else {
        toast.error(res.data.message || "Xóa chi nhánh thất bại.");
      }
    } catch (err) {
      console.error("Delete branch error:", err);
      toast.error("Đã xảy ra lỗi khi xóa chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================
   * RENDER
   * ======================= */
  if (loading) {
    return (
      <div className="p-6 h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Đang tải chi nhánh...</p>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6 h-full w-full flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy chi nhánh.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full w-full">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="flex justify-between flex-wrap">
          <div className="font-medium text-2xl">
            {mode === "view" ? "Thông tin chi nhánh" : "Chỉnh sửa chi nhánh"}
          </div>
        </div>

        <BranchForm
          mode={mode}
          branch={branch}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          onModeChange={setMode}
          handleDelete={branch.default ? null : handleDelete}
        />
      </div>
    </div>
  );
};

export default BranchSettingsPage;
