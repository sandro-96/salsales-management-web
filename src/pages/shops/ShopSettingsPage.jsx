import { useState } from "react";
import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import axiosInstance from "../../api/axiosInstance";
import ShopForm from "../../components/shop/ShopForm.jsx";
import { toast } from "sonner";

const ShopSettingsPage = () => {
  const { enums } = useAuth();
  const { selectedShop, setSelectedShop, fetchShops } = useShop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("view");

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

  return (
    <div className="p-6 h-full w-full">
      <ShopForm
        mode={mode}
        shop={selectedShop}
        enums={enums}
        onSubmit={onSubmit}
        isLoading={isSubmitting}
        onModeChange={setMode}
      />
    </div>
  );
};

export default ShopSettingsPage;
