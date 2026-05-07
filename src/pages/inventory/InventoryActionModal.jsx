import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useShop } from "../../hooks/useShop.js";
import {
  importProductQuantity,
  exportProductQuantity,
  adjustProductQuantity,
  importProductWeight,
  exportProductWeight,
} from "../../api/inventoryApi.js";

function variantLabel(product, variantId) {
  const v = (product?.variants || []).find((x) => x.variantId === variantId);
  return v?.name || variantId || "—";
}

function baseUnitLabel(unit) {
  const u = String(unit || "").trim().toLowerCase();
  if (u === "kg" || u === "g") return "g";
  if (u === "l" || u === "ml") return "ml";
  return u || "unit";
}

function formatBaseStock(baseUnits, unit) {
  if (baseUnits == null) return "—";
  return `${Number(baseUnits).toLocaleString("vi-VN")} ${baseUnitLabel(unit)}`;
}

function toBaseUnits(weight, unit) {
  const u = String(unit || "").trim().toLowerCase();
  const mult = u === "kg" || u === "l" ? 1000 : 1;
  return Math.max(0, Math.round(Number(weight) * mult));
}

const ACTION_CONFIG = {
  IMPORT: {
    title: "Nhập hàng",
    description: "Tăng số lượng tồn kho cho sản phẩm này",
    icon: PackagePlus,
    color: "text-emerald-600 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/15",
    borderColor: "border-emerald-200 dark:border-emerald-500/40",
    buttonLabel: "Xác nhận nhập hàng",
    quantityLabel: "Số lượng nhập",
    quantityPlaceholder: "Nhập số lượng cần nhập...",
  },
  EXPORT: {
    title: "Xuất hàng",
    description: "Giảm số lượng tồn kho cho sản phẩm này",
    icon: PackageMinus,
    color: "text-orange-600 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-500/15",
    borderColor: "border-orange-200 dark:border-orange-500/40",
    buttonLabel: "Xác nhận xuất hàng",
    quantityLabel: "Số lượng xuất",
    quantityPlaceholder: "Nhập số lượng cần xuất...",
  },
  ADJUSTMENT: {
    title: "Điều chỉnh tồn kho",
    description: "Đặt lại số lượng tồn kho cho sản phẩm",
    icon: SlidersHorizontal,
    color: "text-blue-600 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-500/15",
    borderColor: "border-blue-200 dark:border-blue-500/40",
    buttonLabel: "Xác nhận điều chỉnh",
    quantityLabel: "Số lượng mới",
    quantityPlaceholder: "Nhập số lượng tồn kho mới...",
  },
};

const InventoryActionModal = ({ open, onClose, product, actionType, onSuccess }) => {
  const { selectedShopId, selectedBranchId } = useShop();

  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const branchVariantList = useMemo(() => {
    return product?.branchVariants?.length ? product.branchVariants : [];
  }, [product?.branchVariants]);

  useEffect(() => {
    if (open) {
      setQuantity("");
      setNote("");
      const pre = product?.__preselectVariantId;
      const canPre =
        pre &&
        branchVariantList.some((v) => v.variantId === pre);
      if (canPre) {
        setSelectedVariantId(pre);
      } else if (product?.branchVariants?.length === 1) {
        setSelectedVariantId(product.branchVariants[0].variantId);
      } else {
        setSelectedVariantId("");
      }
    }
  }, [open, actionType, product?.__preselectVariantId, branchVariantList, product?.branchVariants]);

  const effectiveVariantId = useMemo(() => {
    if (branchVariantList.length === 0) return "";
    if (branchVariantList.length === 1) return branchVariantList[0].variantId;
    return selectedVariantId;
  }, [branchVariantList, selectedVariantId]);

  const sellByWeight = !!product?.sellByWeight;

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (sellByWeight) return product.stockInBaseUnits ?? 0;
    if (!branchVariantList.length) return product.quantity ?? 0;
    if (branchVariantList.length > 1 && !effectiveVariantId) return null;
    const bv = branchVariantList.find((v) => v.variantId === effectiveVariantId);
    return bv?.quantity ?? 0;
  }, [product, branchVariantList, effectiveVariantId, sellByWeight]);

  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.IMPORT;
  const IconComp = config.icon;

  // ADJUSTMENT hiện chưa hỗ trợ SP cân — hạ action xuống IMPORT/EXPORT tương đương.
  const isAdjustmentForWeight = sellByWeight && actionType === "ADJUSTMENT";

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (actionType !== "ADJUSTMENT" && (!qty || qty <= 0)) {
      toast.error(
        sellByWeight ? "Trọng lượng phải lớn hơn 0." : "Số lượng phải lớn hơn 0.",
      );
      return;
    }
    if (actionType === "ADJUSTMENT" && !sellByWeight &&
        (quantity === "" || qty < 0)) {
      toast.error("Số lượng mới phải >= 0.");
      return;
    }
    if (!sellByWeight && branchVariantList.length > 1 && !effectiveVariantId) {
      toast.error("Vui lòng chọn biến thể.");
      return;
    }

    // SP cân: EXPORT check theo base unit sau khi quy đổi ở server; client best-effort warn.
    if (!sellByWeight && actionType === "EXPORT" && currentStock != null && qty > currentStock) {
      toast.error("Số lượng xuất không được vượt quá tồn kho hiện tại.");
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (sellByWeight) {
        const weightPayload = {
          branchId: selectedBranchId,
          branchProductId: product?.id,
          weight: qty,
          unit: product?.unit,
          note,
        };
        if (actionType === "IMPORT" || actionType === "ADJUSTMENT") {
          // ADJUSTMENT cho SP cân hiện xem như IMPORT vì chưa có API set-absolute.
          res = await importProductWeight(selectedShopId, weightPayload);
        } else {
          res = await exportProductWeight(selectedShopId, weightPayload);
        }
      } else {
        const payload = {
          branchId: selectedBranchId,
          branchProductId: product?.id,
          variantId: branchVariantList.length ? effectiveVariantId : undefined,
          quantity: qty,
          note,
        };
        switch (actionType) {
          case "IMPORT":
            res = await importProductQuantity(selectedShopId, payload);
            break;
          case "EXPORT":
            res = await exportProductQuantity(selectedShopId, payload);
            break;
          case "ADJUSTMENT":
            res = await adjustProductQuantity(selectedShopId, payload);
            break;
          default:
            return;
        }
      }

      const newQty = res?.data?.data;
      const newStockLabel = sellByWeight
        ? formatBaseStock(newQty, product?.unit)
        : Number(newQty).toLocaleString("vi-VN");
      toast.success(
        `${config.title} thành công.${newQty != null ? ` Tồn mới: ${newStockLabel}` : ""}`,
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const enteredWeightInBaseUnits =
    quantity !== "" && sellByWeight
      ? toBaseUnits(Number(quantity), product?.unit)
      : null;
  const previewStock =
    quantity !== ""
      ? sellByWeight
        ? actionType === "EXPORT"
          ? (currentStock ?? 0) - (enteredWeightInBaseUnits ?? 0)
          : (currentStock ?? 0) + (enteredWeightInBaseUnits ?? 0)
        : actionType === "IMPORT"
          ? currentStock + Number(quantity)
          : actionType === "EXPORT"
            ? currentStock - Number(quantity)
            : Number(quantity)
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,680px)] flex-col gap-4 overflow-hidden sm:max-w-md",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1.5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("rounded-lg p-2", config.bgColor)}>
              <IconComp className={cn("h-5 w-5", config.color)} />
            </div>
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-lg border p-3",
              config.borderColor,
              config.bgColor,
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.productName || product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
              <p className="truncate text-sm font-medium">
                {product.productName || product.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {product.sku || "—"}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 whitespace-nowrap">
              Tồn:{" "}
              {currentStock === null
                ? "—"
                : sellByWeight
                  ? formatBaseStock(currentStock, product?.unit)
                  : Number(currentStock).toLocaleString("vi-VN")}
            </Badge>
          </div>

          {!sellByWeight && branchVariantList.length > 1 && (
            <div className="space-y-2">
              <Label>Biến thể</Label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn biến thể" />
                </SelectTrigger>
                <SelectContent>
                  {branchVariantList.map((bv) => (
                    <SelectItem key={bv.variantId} value={bv.variantId}>
                      {variantLabel(product, bv.variantId)} — Tồn:{" "}
                      {(bv.quantity ?? 0).toLocaleString("vi-VN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="inv-quantity"
              className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline"
            >
              <span>
                {sellByWeight
                  ? `${actionType === "EXPORT" ? "Trọng lượng xuất" : "Trọng lượng nhập"} (${product?.unit || "kg"})`
                  : config.quantityLabel}
              </span>
              {isAdjustmentForWeight && (
                <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                  (SP cân chưa hỗ trợ set tồn tuyệt đối — sẽ cộng thêm)
                </span>
              )}
            </Label>
            <NumericInput
              id="inv-quantity"
              value={quantity}
              onChange={setQuantity}
              formatted={false}
              placeholder={
                sellByWeight
                  ? `Ví dụ 0.5 (${product?.unit || "kg"})`
                  : config.quantityPlaceholder
              }
              max={
                !sellByWeight && actionType === "EXPORT" && currentStock != null
                  ? currentStock
                  : undefined
              }
              autoFocus
            />
            {sellByWeight && enteredWeightInBaseUnits != null && (
              <p className="text-xs text-muted-foreground">
                = {enteredWeightInBaseUnits.toLocaleString("vi-VN")}{" "}
                {baseUnitLabel(product?.unit)}
              </p>
            )}
          </div>

          {previewStock !== null && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm text-muted-foreground">Tồn kho sau thao tác</span>
              <span className={`text-sm font-semibold ${previewStock < 0 ? "text-red-600" : previewStock === 0 ? "text-orange-600" : "text-emerald-600"}`}>
                {sellByWeight
                  ? formatBaseStock(previewStock, product?.unit)
                  : previewStock.toLocaleString("vi-VN")}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inv-note">Ghi chú</Label>
            <Textarea
              id="inv-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho giao dịch (tùy chọn)..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || quantity === ""}>
            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {config.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryActionModal;
