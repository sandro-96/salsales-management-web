import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../hooks/useShop";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import {
  getTaxPolicies,
  createTaxPolicy,
  deactivateTaxPolicy,
} from "../../api/taxPolicyApi";
import { toast } from "sonner";
import { useAlertDialog } from "../../hooks/useAlertDialog";
import {
  ArrowLeft,
  Loader2,
  Percent,
  Plus,
  Trash2,
  Ban,
  IdCard,
  LayoutTemplate,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
function formatPolicyDate(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v.replace("T", " ").slice(0, 16);
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d, h = 0, min = 0] = v;
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return String(v);
}

const emptyRule = () => ({
  code: "VAT",
  label: "Thuế GTGT",
  type: "PERCENT",
  value: 0.1,
  applyOnPreviousTaxes: false,
});

const cloneRules = (list) =>
  (list || []).map((r) => ({
    code: r.code ?? "VAT",
    label: r.label ?? "",
    type: r.type ?? "PERCENT",
    value: typeof r.value === "number" ? r.value : Number(r.value) || 0,
    applyOnPreviousTaxes: !!r.applyOnPreviousTaxes,
  }));

/** Mẫu thường gặp — chỉ điền sẵn form, vẫn cần bấm Lưu để tạo chính sách */
const TAX_PRESETS = [
  {
    id: "vn-vat10-included",
    label: "VAT 10% · giá đã gồm thuế",
    hint: "Phổ biến tại VN",
    preset: {
      name: "VAT 10% — giá đã gồm thuế",
      priceIncludesTax: true,
      rules: [
        {
          code: "VAT",
          label: "Thuế GTGT",
          type: "PERCENT",
          value: 0.1,
          applyOnPreviousTaxes: false,
        },
      ],
    },
  },
  {
    id: "vn-vat8-included",
    label: "VAT 8% · giá đã gồm thuế",
    hint: "Mức giảm (khi áp dụng)",
    preset: {
      name: "VAT 8% — giá đã gồm thuế",
      priceIncludesTax: true,
      rules: [
        {
          code: "VAT",
          label: "Thuế GTGT",
          type: "PERCENT",
          value: 0.08,
          applyOnPreviousTaxes: false,
        },
      ],
    },
  },
  {
    id: "vn-vat10-excluded",
    label: "VAT 10% · giá chưa gồm thuế",
    hint: "Cộng thuế trên giá niêm yết",
    preset: {
      name: "VAT 10% — giá chưa gồm thuế",
      priceIncludesTax: false,
      rules: [
        {
          code: "VAT",
          label: "Thuế GTGT",
          type: "PERCENT",
          value: 0.1,
          applyOnPreviousTaxes: false,
        },
      ],
    },
  },
  {
    id: "none",
    label: "Không thuế",
    hint: "Tổng thanh toán = tiền hàng",
    preset: {
      name: "Không áp dụng thuế",
      priceIncludesTax: false,
      rules: [],
    },
  },
];

export default function TaxPolicyPage() {
  const { confirm } = useAlertDialog();
  const { selectedShopId, selectedShop, branches, fetchBranches } = useShop();
  const { hasShopPermission } = useShopPermissions();

  const canManage = hasShopPermission(PERM.SHOP_UPDATE);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("VAT chuẩn");
  const [branchId, setBranchId] = useState("");
  const [priceIncludesTax, setPriceIncludesTax] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [rules, setRules] = useState([emptyRule()]);

  const load = useCallback(async () => {
    if (!selectedShopId || !canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getTaxPolicies(selectedShopId);
      setPolicies(res.data?.data || []);
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Không tải được chính sách thuế",
      );
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedShopId) fetchBranches(selectedShopId);
  }, [selectedShopId, fetchBranches]);

  const updateRule = (idx, field, value) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  const addRule = () => setRules((prev) => [...prev, emptyRule()]);
  const removeRule = (idx) =>
    setRules((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );

  const applyTaxPreset = (preset) => {
    setName(preset.name);
    setPriceIncludesTax(preset.priceIncludesTax);
    setRules(cloneRules(preset.rules));
    toast.info("Đã áp dụng mẫu — kiểm tra phạm vi chi nhánh rồi bấm Lưu.");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedShopId || !canManage) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        branchId: branchId && branchId !== "__shop__" ? branchId : null,
        priceIncludesTax,
        rules: rules.map((r) => ({
          code: r.code || null,
          label: r.label.trim(),
          type: r.type,
          value: Number(r.value),
          applyOnPreviousTaxes: !!r.applyOnPreviousTaxes,
        })),
        effectiveFrom: effectiveFrom
          ? new Date(effectiveFrom).toISOString().slice(0, 19)
          : null,
        effectiveTo: effectiveTo
          ? new Date(effectiveTo).toISOString().slice(0, 19)
          : null,
        priority: 0,
      };
      await createTaxPolicy(selectedShopId, payload);
      toast.success("Đã tạo chính sách thuế");
      setName("VAT chuẩn");
      setBranchId("");
      setEffectiveFrom("");
      setEffectiveTo("");
      setRules([emptyRule()]);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.code ||
        "Không tạo được chính sách";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (policy) => {
    const ok = await confirm(
      `Chính sách "${policy.name}" sẽ không còn áp dụng cho đơn mới.`,
      { title: "Vô hiệu hóa chính sách?" },
    );
    if (!ok) return;
    try {
      await deactivateTaxPolicy(selectedShopId, policy.id);
      toast.success("Đã vô hiệu hóa");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  if (!selectedShopId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chọn cửa hàng để quản lý thuế.
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-sm text-muted-foreground">
          Chỉ <strong>Chủ cửa hàng</strong> và <strong>Quản lý</strong> mới
          chỉnh được chính sách thuế.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={`/shops/${selectedShop?.slug || ""}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Về cài đặt cửa hàng
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex-col gap-6 p-4 md:p-8 md:flex max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to={`/shops/${selectedShop?.slug || ""}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cài đặt cửa hàng
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Percent className="h-7 w-7" />
            Chính sách thuế
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Áp dụng khi tạo đơn và xem trước thuế tại POS. Ưu tiên chính sách
            theo chi nhánh, sau đó mặc định cả shop.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            Mã số thuế (MST)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            MST là mã đăng ký với cơ quan thuế, khác với tỷ lệ VAT ở dưới. Nên
            nhập MST mặc định của pháp nhân tại{" "}
            <Link
              to={`/shops/${selectedShop?.slug || ""}`}
              className="text-foreground font-medium underline underline-offset-2"
            >
              Cài đặt cửa hàng
            </Link>
            . Nếu một chi nhánh có MST riêng (địa điểm kinh doanh đăng ký khác),
            bổ sung tại form chỉnh sửa chi nhánh — để trống ở chi nhánh thì dùng
            MST của cửa hàng.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đang có</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải…
            </div>
          ) : policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có chính sách nào — hệ thống dùng mặc định không thuế cho đến
              khi bạn tạo bản ghi mới.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {policies.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Phạm vi:{" "}
                      {p.branchId
                        ? branches.find((b) => b.id === p.branchId)?.name ||
                          p.branchId
                        : "Cả cửa hàng"}{" "}
                      · Hiệu lực: {formatPolicyDate(p.effectiveFrom)} →{" "}
                      {p.effectiveTo ? formatPolicyDate(p.effectiveTo) : "∞"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.active ? (
                      <Badge>Đang dùng</Badge>
                    ) : (
                      <Badge variant="secondary">Đã tắt</Badge>
                    )}
                    {p.active ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(p)}
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Vô hiệu
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tạo chính sách mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutTemplate className="h-4 w-4" />
                Mẫu nhanh
              </div>
              <p className="text-xs text-muted-foreground">
                Chọn mẫu phù hợp để điền sẵn tên, kiểu giá và tỷ lệ — bạn vẫn có
                thể chỉnh trước khi lưu.
              </p>
              <div className="flex flex-wrap gap-2">
                {TAX_PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-auto min-h-8 py-1.5 px-2.5 text-left"
                    onClick={() => applyTaxPreset(p.preset)}
                  >
                    <span className="block text-xs font-medium leading-tight">
                      {p.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-normal leading-tight">
                      {p.hint}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tên hiển thị *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="VD: VAT 10%"
                />
              </div>
              <div className="space-y-2">
                <Label>Phạm vi</Label>
                <Select
                  value={branchId || "__shop__"}
                  onValueChange={(v) => setBranchId(v === "__shop__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cả cửa hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__shop__">
                      Cả cửa hàng (mặc định)
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Giá bán đã gồm thuế</p>
                <p className="text-xs text-muted-foreground">
                  Bật nếu giá món đã bao gồm VAT (thông dụng tại VN). Khi bật, tổng
                  thanh toán thường không tăng thêm so với tổng giá niêm yết — hệ
                  thống chỉ tách phần VAT để hiển thị NET và thuế trên đơn.
                </p>
              </div>
              <Switch
                checked={priceIncludesTax}
                onCheckedChange={setPriceIncludesTax}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Có hiệu lực từ (tùy chọn)</Label>
                <Input
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  So với thời điểm tạo đơn / xem trước thuế. Để trống = áp dụng
                  ngay (mặc định duy nhất cho shop / chi nhánh).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Đến (tùy chọn, để trống = không hết hạn)</Label>
                <Input
                  type="datetime-local"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Sau mốc này bản ghi không còn được chọn làm chính sách hiệu
                  lực. Để trống = không giới hạn (danh sách hiển thị “∞”). Chọn
                  ngày giờ theo máy bạn; server nhận dạng ISO.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Dòng thuế</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm dòng
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Thuế % nhập dạng số thập phân:{" "}
                <code className="text-foreground">0.1</code> = 10%. Thuế cố định
                (FIXED) là số tiền.
              </p>
              <div className="space-y-3 rounded-md border p-3">
                {rules.map((r, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 sm:grid-cols-12 sm:items-end border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="sm:col-span-2 space-y-1 min-w-0">
                      <Label className="text-xs">Mã</Label>
                      <Input
                        value={r.code}
                        onChange={(e) =>
                          updateRule(idx, "code", e.target.value)
                        }
                        placeholder="VAT"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1 min-w-0">
                      <Label className="text-xs">Nhãn</Label>
                      <Input
                        value={r.label}
                        onChange={(e) =>
                          updateRule(idx, "label", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1 min-w-0">
                      <Label className="text-xs">Loại</Label>
                      <Select
                        value={r.type}
                        onValueChange={(v) => updateRule(idx, "type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Phần trăm</SelectItem>
                          <SelectItem value="FIXED">Cố định (₫)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 space-y-1 min-w-0">
                      <Label className="text-xs">Giá trị</Label>
                      <Input
                        type="number"
                        step="any"
                        value={r.value}
                        onChange={(e) =>
                          updateRule(
                            idx,
                            "value",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 pb-2 min-w-0 shrink-0">
                      <Switch
                        className="shrink-0"
                        checked={r.applyOnPreviousTaxes}
                        onCheckedChange={(c) =>
                          updateRule(idx, "applyOnPreviousTaxes", c)
                        }
                      />
                      <span className="text-xs text-muted-foreground leading-snug">
                        Chồng thuế
                      </span>
                    </div>
                    <div className="sm:col-span-1 flex justify-end sm:justify-center pb-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeRule(idx)}
                        disabled={rules.length <= 1}
                        aria-label="Xóa dòng thuế"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={submitting} variant="success">
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Lưu chính sách
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
