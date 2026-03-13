import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProductForm from "./ProductForm.jsx";
import BranchPricesTab from "./BranchPricesTab.jsx";
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
  selectedBranchId,
  onSuccess,
}) {
  const isEdit = !!product;
  const [mode, setMode] = useState(() => (product ? "view" : "create"));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // Reset mode and tab when product changes or modal opens
  useEffect(() => {
    setMode(product ? "view" : "create");
    setActiveTab("info");
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

        {isEdit ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="shrink-0 w-fit">
              <TabsTrigger value="info">Thông tin chung</TabsTrigger>
              <TabsTrigger value="branch-prices">
                {selectedBranchId
                  ? "Thông tin chi nhánh"
                  : "Giá theo chi nhánh"}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="info"
              className="flex-1 overflow-y-auto pr-1 mt-0"
            >
              <ProductForm
                mode={mode}
                product={product}
                onSubmit={handleSubmit}
                isLoading={loading}
                onModeChange={setMode}
                onCancel={onClose}
              />
            </TabsContent>

            <TabsContent
              value="branch-prices"
              className="flex-1 overflow-y-auto pr-1 mt-0"
            >
              <BranchPricesTab
                shopId={shopId}
                product={product}
                focusBranchId={selectedBranchId}
                onSuccess={onSuccess}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            <ProductForm
              mode="create"
              product={product}
              onSubmit={handleSubmit}
              isLoading={loading}
              onModeChange={setMode}
              onCancel={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
