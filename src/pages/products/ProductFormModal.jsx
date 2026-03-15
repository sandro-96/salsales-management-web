import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "./ProductForm.jsx";
import { createProduct, updateProduct } from "../../api/productApi.js";
import { toast } from "sonner";

/**
 * Modal tạo / chỉnh sửa sản phẩm
 *
 * @param {boolean}  open       - Trạng thái hiển thị dialog
 * @param {Function} onClose    - Callback đóng dialog
 * @param {Object}   [product]  - ProductResponse nếu ở mode edit (id = BranchProduct ID)
 * @param {string}   shopId     - ID cửa hàng
 * @param {Function} onSuccess  - Callback sau khi lưu thành công
 */
export default function ProductFormModal({
  open,
  onClose,
  product,
  shopId,
  onSuccess,
}) {
  const isEdit = !!product;
  const [mode, setMode] = useState(() => (product ? "view" : "create"));
  const [loading, setLoading] = useState(false);

  // Reset mode when product or open changes
  useEffect(() => {
    setMode(product ? "view" : "create");
  }, [product, open]);

  const handleSubmit = async (data, files = []) => {
    try {
      setLoading(true);

      if (isEdit) {
        // Cập nhật sản phẩm
        const res = await updateProduct(shopId, product.productId, data, files);
        if (res.data?.success) {
          toast.success("Cập nhật sản phẩm thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Cập nhật thất bại.");
        }
      } else {
        // Tạo mới
        const res = await createProduct(shopId, data, files);
        if (res.data?.success) {
          toast.success("Thêm sản phẩm thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Thêm sản phẩm thất bại.");
        }
      }
    } catch (err) {
      console.error("ProductFormModal error:", err);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[720px] h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {!isEdit
              ? "Thêm sản phẩm mới"
              : mode === "view"
                ? "Chi tiết sản phẩm"
                : "Chỉnh sửa sản phẩm"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? mode === "view"
                ? "Xem thông tin chi tiết sản phẩm."
                : "Chỉnh sửa thông tin sản phẩm."
              : "Điền thông tin để thêm sản phẩm mới vào cửa hàng."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <ProductForm
            mode={mode}
            product={product}
            onSubmit={handleSubmit}
            isLoading={loading}
            onModeChange={setMode}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
