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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          list.map((item) => ({
            toppingId: item.toppingId ?? "",
            name: item.name ?? "",
            extraPrice: Number(item.extraPrice ?? 0),
            active: item.active !== false,
          })),
        );
      } else {
        setRows([emptyRow()]);
      }
    } catch {
      toast.error(t("pages.products.toppings.fetchError"));
      setRows([emptyRow()]);
    } finally {
      setLoading(false);
    }
  }, [shopId, t]);

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
        toast.error(t("pages.products.toppings.negativePrice"));
        return;
      }
    }
    setSaving(true);
    try {
      const res = await putShopToppings(shopId, payload);
      if (res.data?.success) {
        toast.success(t("pages.products.toppings.saveSuccess"));
        onSaved?.();
        onClose?.();
      } else {
        toast.error(res.data?.message || t("pages.products.toppings.saveFail"));
      }
    } catch {
      toast.error(t("pages.products.toppings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pages.products.toppings.title")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("pages.products.toppings.description")}
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
                  aria-label={t("pages.products.toppings.removeRow")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-10">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("pages.products.toppings.nameLabel")}
                    </Label>
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(index, { name: e.target.value })}
                      placeholder={t("pages.products.toppings.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("pages.products.toppings.extraPriceLabel")}
                    </Label>
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
                  <span className="text-xs text-muted-foreground">
                    {t("pages.products.toppings.active")}
                  </span>
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
              {t("pages.products.toppings.add")}
            </Button>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("pages.products.toppings.close")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("pages.products.toppings.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
