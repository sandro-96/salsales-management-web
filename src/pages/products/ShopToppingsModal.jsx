import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getShopToppings, putShopToppings } from "../../api/shopApi.js";

function emptyRow() {
  return {
    toppingId: "",
    name: "",
    extraPrice: 0,
    active: true,
  };
}

export default function ShopToppingsModal({ open, onClose, shopId, onSaved }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await getShopToppings(shopId);
      const list = res.data?.data;
      if (Array.isArray(list) && list.length > 0) {
        setRows(
          list.map((t) => ({
            toppingId: t.toppingId ?? "",
            name: t.name ?? "",
            extraPrice: Number(t.extraPrice ?? 0),
            active: t.active !== false,
          })),
        );
      } else {
        setRows([emptyRow()]);
      }
    } catch {
      toast.error("Không tải được danh sách topping.");
      setRows([emptyRow()]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (open && shopId) load();
  }, [open, shopId, load]);

  const updateRow = (index, patch) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleSave = async () => {
    if (!shopId) return;
    const payload = rows
      .map((r) => ({
        toppingId: r.toppingId?.trim() || undefined,
        name: (r.name || "").trim(),
        extraPrice: Number(r.extraPrice ?? 0),
        active: r.active !== false,
      }))
      .filter((r) => r.name);
    for (const r of payload) {
      if (r.extraPrice < 0) {
        toast.error("Giá topping không được âm.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await putShopToppings(shopId, payload);
      if (res.data?.success) {
        toast.success("Đã lưu danh mục topping.");
        onSaved?.();
        onClose?.();
      } else {
        toast.error(res.data?.message || "Lưu thất bại.");
      }
    } catch {
      toast.error("Không lưu được topping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cài đặt topping</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Một giá phụ chung cho mỗi topping; gán topping cho từng sản phẩm
              trong form sản phẩm.
            </p>
            {rows.map((row, index) => (
              <div
                key={`${index}-${row.toppingId || "new"}`}
                className="rounded-lg border p-3 space-y-2 relative"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(index)}
                  aria-label="Xóa dòng"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-10">
                  <div className="space-y-1">
                    <Label className="text-xs">Tên *</Label>
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(index, { name: e.target.value })}
                      placeholder="Trân châu"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giá phụ (₫)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={row.extraPrice}
                      onChange={(e) =>
                        updateRow(index, {
                          extraPrice: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.active !== false}
                    onCheckedChange={(v) => updateRow(index, { active: v })}
                  />
                  <span className="text-xs text-muted-foreground">Đang bán</span>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addRow}
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm topping
            </Button>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Lưu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
