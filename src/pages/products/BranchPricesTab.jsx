import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { useShop } from "@/hooks/useShop.js";
import { searchProducts, updateBranchProduct } from "@/api/productApi.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
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
  const { branches } = useShop();

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
      const variantDrafts = {};
      (bp?.branchVariants || []).forEach((bv) => {
        if (bv?.variantId) {
          variantDrafts[bv.variantId] = bv.price ?? 0;
        }
      });
      setRowsMap({ [focusBranchId]: bp });
      setDrafts({
        [focusBranchId]: {
          price: bp.price ?? bp.defaultPrice ?? "",
          branchCostPrice: bp.branchCostPrice ?? bp.costPrice ?? "",
          discountPrice: bp.discountPrice ?? "",
          discountPercentage: bp.discountPercentage ?? "",
          activeInBranch: bp.activeInBranch ?? bp.active ?? true,
          variantPrices: variantDrafts,
          reason: "",
        },
      });
      return;
    }

    if (!product.sku) return;
    setLoading(true);
    try {
      const res = await searchProducts(shopId, {
        keyword: product.sku,
        page: 0,
        size: 100,
      });
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
          const variantDrafts = {};
          (bp?.branchVariants || []).forEach((bv) => {
            if (bv?.variantId) {
              variantDrafts[bv.variantId] = bv.price ?? 0;
            }
          });
          initDrafts[bp.branchId] = {
            price: bp.price ?? bp.defaultPrice ?? "",
            branchCostPrice: bp.branchCostPrice ?? bp.costPrice ?? "",
            discountPrice: bp.discountPrice ?? "",
            discountPercentage: bp.discountPercentage ?? "",
            activeInBranch: bp.activeInBranch ?? bp.active ?? true,
            variantPrices: variantDrafts,
            reason: "",
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
      const hasVariantCatalog = Array.isArray(product?.variants);
      const hasBranchVariants =
        Array.isArray(row?.branchVariants) && row.branchVariants.length > 0;
      const shouldSendVariants = hasVariantCatalog && hasBranchVariants;

      const updatedVariants = shouldSendVariants
        ? row.branchVariants.map((bv) => {
            const nextPrice = draft?.variantPrices?.[bv.variantId];
            const parsed =
              nextPrice === "" || nextPrice == null ? 0 : Number(nextPrice);
            return {
              ...bv,
              // price-only editor: 0 means "fallback to branch/base price"
              price: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
            };
          })
        : row?.branchVariants ?? null;

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
        // Inventory is managed on Inventory pages; preserve existing values here.
        quantity: row.quantity ?? 0,
        minQuantity: row.minQuantity ?? 0,
        expiryDate: row.expiryDate || null,
        activeInBranch: draft.activeInBranch,
        branchVariants: updatedVariants,
        reason: draft.reason || null,
      };
      const res = await updateBranchProduct(shopId, branchId, row.id, payload);
      if (res.data?.success) {
        toast.success("Đã cập nhật chi nhánh.");
        setRowsMap((prev) => ({
          ...prev,
          [branchId]: { ...prev[branchId], ...res.data.data },
        }));
        // Reset reason after successful save
        setDrafts((prev) => ({
          ...prev,
          [branchId]: { ...prev[branchId], reason: "" },
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

    const rowVariantMap = {};
    (row.branchVariants || []).forEach((bv) => {
      if (bv?.variantId) rowVariantMap[bv.variantId] = bv.price ?? 0;
    });
    const draftVariantMap = draft.variantPrices || {};
    const hasVariantChanges =
      Array.isArray(product?.variants) &&
      Array.isArray(row?.branchVariants) &&
      row.branchVariants.length > 0 &&
      Object.keys(rowVariantMap).some(
        (vid) => String(draftVariantMap?.[vid] ?? 0) !== String(rowVariantMap[vid] ?? 0),
      );

    return (
      String(draft.price) !== String(row.price ?? row.defaultPrice ?? "") ||
      String(draft.branchCostPrice) !==
        String(row.branchCostPrice ?? row.costPrice ?? "") ||
      String(draft.discountPrice) !== String(row.discountPrice ?? "") ||
      String(draft.discountPercentage) !==
        String(row.discountPercentage ?? "") ||
      hasVariantChanges ||
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
                      label="Giá bán tại chi nhánh"
                      placeholder={String(product?.defaultPrice ?? "")}
                      value={draft.price}
                      onChange={(v) => setDraftField(branch.id, "price", v)}
                      suffix=" ₫"
                    />
                    <Field
                      label="Giá vốn tại chi nhánh"
                      placeholder={String(product?.costPrice ?? "")}
                      value={draft.branchCostPrice}
                      onChange={(v) =>
                        setDraftField(branch.id, "branchCostPrice", v)
                      }
                      suffix=" ₫"
                    />
                    <Field
                      label="Giá khuyến mãi"
                      placeholder="Không áp dụng"
                      value={draft.discountPrice}
                      onChange={(v) =>
                        setDraftField(branch.id, "discountPrice", v)
                      }
                      suffix=" ₫"
                    />
                    <Field
                      label="Giảm giá (%)"
                      placeholder="0"
                      max={100}
                      value={draft.discountPercentage}
                      onChange={(v) =>
                        setDraftField(branch.id, "discountPercentage", v)
                      }
                      suffix=" %"
                    />
                  </div>

                  {/* Variant pricing */}
                  {Array.isArray(product?.variants) &&
                    Array.isArray(row?.branchVariants) &&
                    row.branchVariants.length > 0 && (
                      <div className="border-t pt-3 flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Giá biến thể tại chi nhánh (0 = dùng giá chi nhánh)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {row.branchVariants.map((bv) => {
                            const meta = (product.variants || []).find(
                              (v) => v.variantId === bv.variantId,
                            );
                            const label = meta?.name || bv.variantId || "—";
                            const current =
                              draft.variantPrices?.[bv.variantId] ?? bv.price ?? 0;
                            return (
                              <Field
                                key={bv.variantId}
                                label={label}
                                placeholder="0"
                                value={current}
                                onChange={(v) => {
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [branch.id]: {
                                      ...prev[branch.id],
                                      variantPrices: {
                                        ...(prev[branch.id]?.variantPrices || {}),
                                        [bv.variantId]: v,
                                      },
                                    },
                                  }));
                                }}
                                suffix=" ₫"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Lý do thay đổi giá */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">
                      Lý do thay đổi giá
                    </label>
                    <Input
                      placeholder="Lý do thay đổi giá (không bắt buộc)"
                      value={draft.reason}
                      onChange={(e) =>
                        setDraftField(branch.id, "reason", e.target.value)
                      }
                    />
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

                  {/* Lịch sử giá chi nhánh */}
                  {rowsMap[branch.id]?.branchPriceHistory?.length > 0 && (
                    <div className="border-t pt-3 flex flex-col gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Lịch sử giá chi nhánh (
                        {rowsMap[branch.id].branchPriceHistory.length} mục)
                      </span>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted text-muted-foreground border-b">
                              <th className="text-left px-2 py-1.5 font-medium">
                                Thời điểm
                              </th>
                              <th className="text-right px-2 py-1.5 font-medium">
                                Giá cũ
                              </th>
                              <th className="text-right px-2 py-1.5 font-medium">
                                Giá mới
                              </th>
                              <th className="text-left px-2 py-1.5 font-medium">
                                Lý do
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rowsMap[branch.id].branchPriceHistory.map(
                              (h, i) => (
                                <tr
                                  key={i}
                                  className="border-b last:border-0 hover:bg-muted/30"
                                >
                                  <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">
                                    {h.changedAt
                                      ? new Date(h.changedAt).toLocaleString(
                                          "vi-VN",
                                          {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                          },
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    {h.oldPrice != null
                                      ? Number(h.oldPrice).toLocaleString(
                                          "vi-VN",
                                        ) + " ₫"
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-medium">
                                    {h.newPrice != null
                                      ? Number(h.newPrice).toLocaleString(
                                          "vi-VN",
                                        ) + " ₫"
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1.5 text-muted-foreground italic">
                                    {h.reason ?? "-"}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
function Field({ label, value, onChange, placeholder = "", max, suffix = "" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">
        {label}
      </label>
      <NumericInput
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        suffix={suffix}
      />
    </div>
  );
}
