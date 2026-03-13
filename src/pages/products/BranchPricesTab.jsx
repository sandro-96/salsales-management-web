import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { useShop } from "@/hooks/useShop.js";
import { getProducts, updateBranchProduct } from "@/api/productApi.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

/**
 * Tab chỉnh sửa BranchProduct fields theo từng chi nhánh.
 *
 * @param {string}   shopId         - ID cửa hàng
 * @param {Object}   product        - ProductResponse (merged BranchProduct+Product)
 * @param {string}   [focusBranchId] - Nếu có, chỉ hiển thị chi nhánh đó
 */
export default function BranchPricesTab({
  shopId,
  product,
  focusBranchId,
  onSuccess,
}) {
  const { branches, selectedShop } = useShop();
  const trackInventory = selectedShop?.trackInventory ?? false;

  const [rowsMap, setRowsMap] = useState({});
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(false);

  // Branches to display — if focusBranchId set, show only that one
  const visibleBranches = focusBranchId
    ? branches.filter((b) => b.id === focusBranchId)
    : branches;

  const fetchBranchRows = useCallback(async () => {
    if (!shopId || !product || branches.length === 0) return;

    // When a branch is focused, product already contains all BranchProduct fields
    if (focusBranchId) {
      const bp = product;
      setRowsMap({ [focusBranchId]: bp });
      setDrafts({
        [focusBranchId]: {
          price: bp.price ?? bp.defaultPrice ?? "",
          branchCostPrice: bp.branchCostPrice ?? bp.costPrice ?? "",
          discountPrice: bp.discountPrice ?? "",
          discountPercentage: bp.discountPercentage ?? "",
          quantity: bp.quantity ?? "",
          minQuantity: bp.minQuantity ?? "",
          expiryDate: bp.expiryDate ?? "",
          activeInBranch: bp.activeInBranch ?? bp.active ?? true,
        },
      });
      return;
    }

    if (!product.sku) return;
    setLoading(true);
    try {
      const res = await getProducts(
        shopId,
        { keyword: product.sku, page: 0, size: 100 },
        true,
      );
      const data = res.data?.data;
      const list =
        data && "content" in data
          ? data.content
          : Array.isArray(data)
            ? data
            : [];

      const map = {};
      list.forEach((bp) => {
        if (bp.branchId) map[bp.branchId] = bp;
      });
      setRowsMap(map);

      const initDrafts = {};
      list.forEach((bp) => {
        if (bp.branchId) {
          initDrafts[bp.branchId] = {
            price: bp.price ?? bp.defaultPrice ?? "",
            branchCostPrice: bp.branchCostPrice ?? bp.costPrice ?? "",
            discountPrice: bp.discountPrice ?? "",
            discountPercentage: bp.discountPercentage ?? "",
            quantity: bp.quantity ?? "",
            minQuantity: bp.minQuantity ?? "",
            expiryDate: bp.expiryDate ?? "",
            activeInBranch: bp.activeInBranch ?? bp.active ?? true,
          };
        }
      });
      setDrafts(initDrafts);
    } catch (err) {
      console.error("BranchPricesTab fetch error:", err);
      toast.error("Không thể tải dữ liệu theo chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, [shopId, product, focusBranchId, branches]);

  useEffect(() => {
    fetchBranchRows();
  }, [fetchBranchRows]);

  const setDraftField = (branchId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [branchId]: { ...prev[branchId], [field]: value },
    }));
  };

  const handleSave = async (branchId) => {
    const row = rowsMap[branchId];
    if (!row?.id) return;

    const draft = drafts[branchId];
    setSaving((prev) => ({ ...prev, [branchId]: true }));
    try {
      const payload = {
        price: draft.price !== "" ? Number(draft.price) : null,
        branchCostPrice:
          draft.branchCostPrice !== "" ? Number(draft.branchCostPrice) : null,
        discountPrice:
          draft.discountPrice !== "" ? Number(draft.discountPrice) : null,
        discountPercentage:
          draft.discountPercentage !== ""
            ? Number(draft.discountPercentage)
            : null,
        quantity: draft.quantity !== "" ? Number(draft.quantity) : null,
        minQuantity:
          draft.minQuantity !== "" ? Number(draft.minQuantity) : null,
        expiryDate: draft.expiryDate || null,
        activeInBranch: draft.activeInBranch,
      };
      const res = await updateBranchProduct(shopId, branchId, row.id, payload);
      if (res.data?.success) {
        toast.success("Đã cập nhật chi nhánh.");
        setRowsMap((prev) => ({
          ...prev,
          [branchId]: { ...prev[branchId], ...res.data.data },
        }));
        onSuccess?.();
      } else {
        toast.error(res.data?.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error("updateBranchProduct error:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật.");
    } finally {
      setSaving((prev) => ({ ...prev, [branchId]: false }));
    }
  };

  const isDirty = (branchId) => {
    const row = rowsMap[branchId];
    const draft = drafts[branchId];
    if (!row || !draft) return false;
    return (
      String(draft.price) !== String(row.price ?? row.defaultPrice ?? "") ||
      String(draft.branchCostPrice) !==
        String(row.branchCostPrice ?? row.costPrice ?? "") ||
      String(draft.discountPrice) !== String(row.discountPrice ?? "") ||
      String(draft.discountPercentage) !==
        String(row.discountPercentage ?? "") ||
      String(draft.quantity) !== String(row.quantity ?? "") ||
      String(draft.minQuantity) !== String(row.minQuantity ?? "") ||
      String(draft.expiryDate) !== String(row.expiryDate ?? "") ||
      draft.activeInBranch !== (row.activeInBranch ?? row.active ?? true)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
        <Store className="h-8 w-8 opacity-40" />
        <p className="text-sm">Cửa hàng chưa có chi nhánh nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Shop defaults summary — only show when viewing all branches */}
      {!focusBranchId && (
        <p className="text-sm text-muted-foreground">
          Giá mặc định shop:{" "}
          <span className="font-medium text-foreground">
            {product?.defaultPrice
              ? Number(product.defaultPrice).toLocaleString("vi-VN") + " ₫"
              : "-"}
          </span>
          {" · "}Giá vốn mặc định:{" "}
          <span className="font-medium text-foreground">
            {product?.costPrice
              ? Number(product.costPrice).toLocaleString("vi-VN") + " ₫"
              : "-"}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        {visibleBranches.map((branch) => {
          const row = rowsMap[branch.id];
          const draft = drafts[branch.id];
          const dirty = isDirty(branch.id);
          const isSaving = saving[branch.id];

          return (
            <div
              key={branch.id}
              className="rounded-lg border bg-card p-4 flex flex-col gap-3"
            >
              {/* Branch header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">{branch.name}</span>
                  {!row && (
                    <Badge variant="outline" className="text-xs">
                      Chưa có sản phẩm
                    </Badge>
                  )}
                </div>
                {row && draft && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Đang bán
                    </span>
                    <Switch
                      checked={draft.activeInBranch}
                      onCheckedChange={(val) =>
                        setDraftField(branch.id, "activeInBranch", val)
                      }
                    />
                  </div>
                )}
              </div>

              {row && draft ? (
                <>
                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Giá bán tại chi nhánh (₫)"
                      placeholder={String(product?.defaultPrice ?? "")}
                      value={draft.price}
                      onChange={(v) => setDraftField(branch.id, "price", v)}
                    />
                    <Field
                      label="Giá vốn tại chi nhánh (₫)"
                      placeholder={String(product?.costPrice ?? "")}
                      value={draft.branchCostPrice}
                      onChange={(v) =>
                        setDraftField(branch.id, "branchCostPrice", v)
                      }
                    />
                    <Field
                      label="Giá khuyến mãi (₫)"
                      placeholder="Không áp dụng"
                      value={draft.discountPrice}
                      onChange={(v) =>
                        setDraftField(branch.id, "discountPrice", v)
                      }
                    />
                    <Field
                      label="Giảm giá (%)"
                      placeholder="0"
                      max={100}
                      value={draft.discountPercentage}
                      onChange={(v) =>
                        setDraftField(branch.id, "discountPercentage", v)
                      }
                    />
                  </div>

                  {/* Inventory */}
                  <div className="border-t pt-3 grid grid-cols-2 gap-3">
                    {trackInventory && (
                      <>
                        <Field
                          label="Tồn kho"
                          placeholder="0"
                          value={draft.quantity}
                          onChange={(v) =>
                            setDraftField(branch.id, "quantity", v)
                          }
                        />
                        <Field
                          label="Ngưỡng cảnh báo tồn kho"
                          placeholder="0"
                          value={draft.minQuantity}
                          onChange={(v) =>
                            setDraftField(branch.id, "minQuantity", v)
                          }
                        />
                      </>
                    )}
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                      <label className="text-xs text-muted-foreground font-medium">
                        Hạn sử dụng
                      </label>
                      <Input
                        type="date"
                        value={draft.expiryDate}
                        onChange={(e) =>
                          setDraftField(branch.id, "expiryDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="success"
                      disabled={!dirty || isSaving}
                      onClick={() => handleSave(branch.id)}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Đang lưu...
                        </>
                      ) : focusBranchId ? (
                        "Lưu thay đổi"
                      ) : (
                        "Lưu chi nhánh này"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Sản phẩm chưa được thêm vào chi nhánh này.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Small helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = "", max }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">
        {label}
      </label>
      <Input
        type="number"
        min={0}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
