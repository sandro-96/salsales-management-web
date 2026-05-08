import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Search,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { createPromotion, updatePromotion } from "../../api/promotionApi.js";
import { getProducts } from "../../api/productApi.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { cn } from "@/lib/utils";

const toLocalDateTime = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const parseLocalDateTime = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export default function PromotionFormModal({
  open,
  onClose,
  promotion,
  shopId,
  branches,
  onSuccess,
}) {
  const isEdit = !!promotion;
  const { hasShopPermission } = useShopPermissions();
  const canUpdate = hasShopPermission(PERM.PROMOTION_UPDATE);
  const canCreate = hasShopPermission(PERM.PROMOTION_CREATE);
  const readOnly = isEdit ? !canUpdate : !canCreate;

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [active, setActive] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [applyAll, setApplyAll] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productKeyword, setProductKeyword] = useState("");

  useEffect(() => {
    if (!open) return;
    setAttemptedSubmit(false);
    if (promotion) {
      setName(promotion.name || "");
      setDiscountType(promotion.discountType || "PERCENT");
      setDiscountValue(
        promotion.discountValue != null ? String(promotion.discountValue) : "",
      );
      setStartDate(parseLocalDateTime(promotion.startDate));
      setEndDate(parseLocalDateTime(promotion.endDate));
      setActive(promotion.active ?? true);
      setBranchId(promotion.branchId || "");
      const ids = promotion.applicableProductIds;
      if (Array.isArray(ids) && ids.length > 0) {
        setApplyAll(false);
        setSelectedProductIds(ids);
      } else {
        setApplyAll(true);
        setSelectedProductIds([]);
      }
    } else {
      setName("");
      setDiscountType("PERCENT");
      setDiscountValue("");
      setStartDate(null);
      setEndDate(null);
      setActive(true);
      setBranchId("");
      setApplyAll(true);
      setSelectedProductIds([]);
    }
    setProductKeyword("");
  }, [open, promotion]);

  const fetchProducts = useCallback(async () => {
    if (!shopId) return;
    setProductsLoading(true);
    try {
      const res = await getProducts(shopId, { page: 0, size: 200 });
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setProducts(data.content ?? []);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (open && !applyAll) {
      fetchProducts();
    }
  }, [open, applyAll, fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!productKeyword.trim()) return products;
    const kw = productKeyword.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(kw) ||
        p.sku?.toLowerCase().includes(kw),
    );
  }, [products, productKeyword]);

  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const validate = () => {
    if (!name.trim()) {
      toast.error("Tên khuyến mãi không được để trống.");
      return false;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0.");
      return false;
    }
    if (discountType === "PERCENT" && Number(discountValue) > 100) {
      toast.error("Phần trăm giảm giá không được vượt quá 100%.");
      return false;
    }
    if (!startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu.");
      return false;
    }
    if (!endDate) {
      toast.error("Vui lòng chọn ngày kết thúc.");
      return false;
    }
    if (startDate >= endDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      discountType,
      discountValue: Number(discountValue),
      applicableProductIds:
        applyAll || selectedProductIds.length === 0
          ? null
          : selectedProductIds,
      startDate: toLocalDateTime(startDate),
      endDate: toLocalDateTime(endDate),
      active,
      branchId: branchId || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updatePromotion(promotion.id, shopId, payload);
        if (res.data?.success) {
          toast.success("Cập nhật khuyến mãi thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Cập nhật thất bại.");
        }
      } else {
        const res = await createPromotion(shopId, payload);
        if (res.data?.success) {
          toast.success("Tạo khuyến mãi thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Tạo khuyến mãi thất bại.");
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {readOnly
              ? "Chi tiết khuyến mãi"
              : isEdit
                ? "Chỉnh sửa khuyến mãi"
                : "Tạo khuyến mãi mới"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Chỉnh sửa thông tin khuyến mãi."
              : "Điền thông tin để tạo khuyến mãi mới."}
          </DialogDescription>
        </DialogHeader>

        <fieldset
          disabled={readOnly}
          className="flex-1 overflow-y-auto space-y-5 pr-1 py-2 disabled:opacity-70"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="promo-name"
              className={attemptedSubmit && !name.trim() ? "text-destructive" : undefined}
            >
              Tên khuyến mãi *
            </Label>
            <Input
              id="promo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Giảm giá mùa hè"
              autoFocus
              aria-invalid={attemptedSubmit && !name.trim()}
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={attemptedSubmit && !discountType ? "text-destructive" : undefined}>
                Loại giảm giá *
              </Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger aria-invalid={attemptedSubmit && !discountType}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                  <SelectItem value="AMOUNT">Số tiền (đ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="promo-value"
                className={
                  attemptedSubmit && (!discountValue || Number(discountValue) <= 0)
                    ? "text-destructive"
                    : undefined
                }
              >
                Giá trị giảm *{" "}
                {discountType === "PERCENT" ? "(max 100%)" : "(VNĐ)"}
              </Label>
              <NumericInput
                id="promo-value"
                value={discountValue}
                onChange={setDiscountValue}
                formatted={discountType === "AMOUNT"}
                max={discountType === "PERCENT" ? 100 : undefined}
                placeholder={discountType === "PERCENT" ? "VD: 15" : "VD: 50000"}
                aria-invalid={attemptedSubmit && (!discountValue || Number(discountValue) <= 0)}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={attemptedSubmit && !startDate ? "text-destructive" : undefined}>
                Ngày bắt đầu *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      attemptedSubmit && !startDate && "border-destructive aria-invalid:border-destructive",
                    )}
                    aria-invalid={attemptedSubmit && !startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      if (d) {
                        d.setHours(0, 0, 0, 0);
                        setStartDate(d);
                      }
                    }}
                    locale={vi}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className={attemptedSubmit && !endDate ? "text-destructive" : undefined}>
                Ngày kết thúc *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      attemptedSubmit && !endDate && "border-destructive aria-invalid:border-destructive",
                    )}
                    aria-invalid={attemptedSubmit && !endDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      if (d) {
                        d.setHours(23, 59, 59, 0);
                        setEndDate(d);
                      }
                    }}
                    disabled={(d) => startDate && d < startDate}
                    locale={vi}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Branch scope */}
          <div className="space-y-2">
            <Label>Phạm vi áp dụng</Label>
            <Select
              value={branchId || "__all__"}
              onValueChange={(v) => setBranchId(v === "__all__" ? "" : v)}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toàn shop" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="__all__">
                  Toàn shop (tất cả chi nhánh)
                </SelectItem>
                {branches?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi phạm vi (toàn shop / chi nhánh) khi chỉnh
                sửa.
              </p>
            )}
          </div>

          {/* Active switch */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Kích hoạt</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bật để khuyến mãi có hiệu lực trong thời gian áp dụng.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          {/* Product scope */}
          <div className="space-y-3">
            <Label>Sản phẩm áp dụng</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={applyAll}
                  onChange={() => {
                    setApplyAll(true);
                    setSelectedProductIds([]);
                  }}
                  className="accent-primary"
                />
                <span className="text-sm">Tất cả sản phẩm</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={!applyAll}
                  onChange={() => setApplyAll(false)}
                  className="accent-primary"
                />
                <span className="text-sm">Chọn sản phẩm cụ thể</span>
              </label>
            </div>

            {!applyAll && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={productKeyword}
                      onChange={(e) => setProductKeyword(e.target.value)}
                      placeholder="Tìm sản phẩm..."
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {selectedProductIds.length > 0 && (
                  <div className="px-3 py-1.5 border-b bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                      Đã chọn {selectedProductIds.length} sản phẩm
                    </span>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const id = p.productId || p.id;
                      const checked = selectedProductIds.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleProduct(id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.name}</p>
                            {p.sku && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {p.sku}
                              </p>
                            )}
                          </div>
                          {p.defaultPrice != null && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {Number(p.defaultPrice).toLocaleString("vi-VN")}đ
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Không tìm thấy sản phẩm.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </fieldset>

        <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly ? "Đóng" : "Hủy"}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={submitting} variant="success">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit ? "Lưu thay đổi" : "Tạo khuyến mãi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
