import { useState } from "react";
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
 * @param {string}   branchId   - ID chi nhánh hiện tại (dùng fallback khi edit)
 * @param {Array}    branches   - Danh sách chi nhánh của shop (dùng khi create)
 * @param {Function} onSuccess  - Callback sau khi lưu thành công
 */
export default function ProductFormModal({
  open,
  onClose,
  product,
  shopId,
  branchId,
  branches = [],
  onSuccess,
}) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);

      if (isEdit) {
        // Cập nhật: id = BranchProduct ID, áp dụng cho chi nhánh của product
        const { branchIds: _ignored, ...productData } = data;
        const res = await updateProduct(shopId, product.id, productData, [
          product.branchId ?? branchId,
        ]);
        if (res.data?.success) {
          toast.success("Cập nhật sản phẩm thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Cập nhật thất bại.");
        }
      } else {
        // Tạo mới: dùng createProduct (shop-level) với danh sách chi nhánh đã chọn
        const { branchIds = [], ...productData } = data;

        if (branchIds.length === 0) {
          toast.error("Vui lòng chọn ít nhất 1 chi nhánh để phân bổ sản phẩm.");
          return;
        }

        const res = await createProduct(shopId, productData, branchIds);
        if (res.data?.success) {
          toast.success(
            `Thêm sản phẩm thành công cho ${branchIds.length} chi nhánh.`,
          );
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
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Chỉnh sửa thông tin sản phẩm tại chi nhánh."
              : "Điền thông tin để thêm sản phẩm mới vào cửa hàng."}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          mode={isEdit ? "edit" : "create"}
          product={product}
          onSubmit={handleSubmit}
          isLoading={loading}
          onModeChange={() => {}}
          branches={branches}
        />
      </DialogContent>
    </Dialog>
  );
}
