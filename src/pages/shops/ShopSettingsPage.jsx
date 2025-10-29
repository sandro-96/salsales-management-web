import { useState } from "react";
import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import axiosInstance from "../../api/axiosInstance";
import { deleteShop } from "../../api/shopApi.js";
import ShopForm from "../../components/shop/ShopForm.jsx";
import { toast } from "sonner";
import { Button } from "../../components/ui/button.jsx";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { useNavigate } from "react-router-dom";

const ShopSettingsPage = () => {
  const { confirm } = useAlertDialog();
  const { enums } = useAuth();
  const { selectedShop, setSelectedShop, fetchShops } = useShop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("view");
  const navigate = useNavigate();

  const onSubmit = async (data, file) => {
    try {
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" })
      );
      if (file) formData.append("file", file);
      setIsSubmitting(true);
      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        toast.success("Cập nhật cửa hàng thành công.");

        const response = res.data.data;
        response.role = selectedShop.role;
        setSelectedShop(response);
        await fetchShops();
        setMode("view");
      } else {
        toast.error("Cập nhật thất bại:", res.data.message);
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi cập nhật cửa hàng.");
      console.error("Error updating shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShop) return;
    const ok = await confirm(
      "Bạn có chắc muốn xóa cửa hàng này không? Hành động này không thể hoàn tác.",
      {
        title: "Xóa cửa hàng",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      }
    );

    if (ok) {
      try {
        setIsSubmitting(true);
        const res = await deleteShop(selectedShop.id);
        if (res.data.success) {
          toast.success("Xóa cửa hàng thành công.");
          setSelectedShop(null);
          await fetchShops();
          navigate(-1);
        } else {
          toast.error("Xóa cửa hàng thất bại:", res.data.message);
        }
      } catch (err) {
        toast.error("Đã xảy ra lỗi khi xóa cửa hàng.");
        console.error("Error deleting shop:", err);
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
              ? "Thông tin cửa hàng"
              : mode === "edit"
              ? "Chỉnh sửa cửa hàng"
              : ""}
          </div>
          {mode === "edit" && (
            <Button
              variant="destructive"
              type="button"
              onClick={() => handleDelete()}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
        </div>

        <ShopForm
          mode={mode}
          shop={selectedShop}
          enums={enums}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          onModeChange={setMode}
        />
      </div>
    </div>
  );
};

export default ShopSettingsPage;
