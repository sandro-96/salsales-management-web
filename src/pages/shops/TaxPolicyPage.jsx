import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const emptyRule = (t) => ({
  code: "VAT",
  label: t("pages.shops.tax.defaultVatLabel"),
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

/** Quick templates — only pre-fill the form; Save still creates the policy */
function getTaxPresets(t) {
  const vatLabel = t("pages.shops.tax.defaultVatLabel");
  return [
    {
      id: "vn-vat10-included",
      label: t("pages.shops.tax.preset.vnVat10Included.label"),
      hint: t("pages.shops.tax.preset.vnVat10Included.hint"),
      preset: {
        name: t("pages.shops.tax.preset.vnVat10Included.name"),
        priceIncludesTax: true,
        rules: [
          {
            code: "VAT",
            label: vatLabel,
            type: "PERCENT",
            value: 0.1,
            applyOnPreviousTaxes: false,
          },
        ],
      },
    },
    {
      id: "vn-vat8-included",
      label: t("pages.shops.tax.preset.vnVat8Included.label"),
      hint: t("pages.shops.tax.preset.vnVat8Included.hint"),
      preset: {
        name: t("pages.shops.tax.preset.vnVat8Included.name"),
        priceIncludesTax: true,
        rules: [
          {
            code: "VAT",
            label: vatLabel,
            type: "PERCENT",
            value: 0.08,
            applyOnPreviousTaxes: false,
          },
        ],
      },
    },
    {
      id: "vn-vat10-excluded",
      label: t("pages.shops.tax.preset.vnVat10Excluded.label"),
      hint: t("pages.shops.tax.preset.vnVat10Excluded.hint"),
      preset: {
        name: t("pages.shops.tax.preset.vnVat10Excluded.name"),
        priceIncludesTax: false,
        rules: [
          {
            code: "VAT",
            label: vatLabel,
            type: "PERCENT",
            value: 0.1,
            applyOnPreviousTaxes: false,
          },
        ],
      },
    },
    {
      id: "none",
      label: t("pages.shops.tax.preset.none.label"),
      hint: t("pages.shops.tax.preset.none.hint"),
      preset: {
        name: t("pages.shops.tax.preset.none.name"),
        priceIncludesTax: false,
        rules: [],
      },
    },
  ];
}

export default function TaxPolicyPage() {
  const { t, i18n } = useTranslation();
  const { confirm } = useAlertDialog();
  const { selectedShopId, selectedShop, branches, fetchBranches } = useShop();
  const { hasShopPermission } = useShopPermissions();

  const canManage = hasShopPermission(PERM.SHOP_UPDATE);

  const defaultPolicyNameRef = useRef(t("pages.shops.tax.defaultPolicyName"));
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(() => t("pages.shops.tax.defaultPolicyName"));
  const [branchId, setBranchId] = useState("");
  const [priceIncludesTax, setPriceIncludesTax] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [rules, setRules] = useState(() => [emptyRule(t)]);

  const taxPresets = useMemo(() => getTaxPresets(t), [t, i18n.language]);

  useEffect(() => {
    const nextDefault = t("pages.shops.tax.defaultPolicyName");
    setName((current) =>
      current === defaultPolicyNameRef.current ? nextDefault : current,
    );
    defaultPolicyNameRef.current = nextDefault;
  }, [i18n.language, t]);

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
        e.response?.data?.message || t("pages.shops.tax.fetchFail"),
      );
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, canManage, t]);

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

  const addRule = () => setRules((prev) => [...prev, emptyRule(t)]);
  const removeRule = (idx) =>
    setRules((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );

  const applyTaxPreset = (preset) => {
    setName(preset.name);
    setPriceIncludesTax(preset.priceIncludesTax);
    setRules(cloneRules(preset.rules));
    toast.info(t("pages.shops.tax.presetApplied"));
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
      toast.success(t("pages.shops.tax.createSuccess"));
      const resetName = t("pages.shops.tax.defaultPolicyName");
      setName(resetName);
      defaultPolicyNameRef.current = resetName;
      setBranchId("");
      setEffectiveFrom("");
      setEffectiveTo("");
      setRules([emptyRule(t)]);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.code ||
        t("pages.shops.tax.createFail");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (policy) => {
    const ok = await confirm(
      t("pages.shops.tax.deactivateConfirm", { name: policy.name }),
      { title: t("pages.shops.tax.deactivateTitle") },
    );
    if (!ok) return;
    try {
      await deactivateTaxPolicy(selectedShopId, policy.id);
      toast.success(t("pages.shops.tax.deactivateSuccess"));
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("pages.shops.tax.actionFail"),
      );
    }
  };

  if (!selectedShopId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t("pages.shops.tax.selectShop")}
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-sm text-muted-foreground">
          {t("pages.shops.tax.noPermission")}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={`/shops/${selectedShop?.slug || ""}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("pages.shops.tax.backToSettings")}
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
              {t("pages.shops.tax.backToSettings")}
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Percent className="h-7 w-7" />
            {t("pages.shops.tax.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pages.shops.tax.subtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            {t("pages.shops.tax.mstTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("pages.shops.tax.mstDesc")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("pages.shops.tax.existingTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("pages.shops.tax.loading")}
            </div>
          ) : policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("pages.shops.tax.emptyPolicies")}
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
                      {t("pages.shops.tax.scope")}{" "}
                      {p.branchId
                        ? branches.find((b) => b.id === p.branchId)?.name ||
                          p.branchId
                        : t("pages.shops.tax.wholeShop")}{" "}
                      · {t("pages.shops.tax.effective")}{" "}
                      {formatPolicyDate(p.effectiveFrom)} →{" "}
                      {p.effectiveTo
                        ? formatPolicyDate(p.effectiveTo)
                        : t("pages.shops.tax.effectiveForever")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.active ? (
                      <Badge>{t("pages.shops.tax.badgeActive")}</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("pages.shops.tax.badgeInactive")}
                      </Badge>
                    )}
                    {p.active ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(p)}
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        {t("pages.shops.tax.deactivate")}
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
          <CardTitle className="text-base">
            {t("pages.shops.tax.createTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutTemplate className="h-4 w-4" />
                {t("pages.shops.tax.quickTemplates")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("pages.shops.tax.quickTemplatesHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                {taxPresets.map((p) => (
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
                <Label>{t("pages.shops.tax.displayName")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t("pages.shops.tax.displayNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pages.shops.tax.scopeLabel")}</Label>
                <Select
                  value={branchId || "__shop__"}
                  onValueChange={(v) => setBranchId(v === "__shop__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("pages.shops.tax.scopePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__shop__">
                      {t("pages.shops.tax.scopeDefault")}
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
                <p className="text-sm font-medium">
                  {t("pages.shops.tax.priceIncludesTax")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("pages.shops.tax.priceIncludesTaxHint")}
                </p>
              </div>
              <Switch
                checked={priceIncludesTax}
                onCheckedChange={setPriceIncludesTax}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pages.shops.tax.effectiveFrom")}</Label>
                <Input
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {t("pages.shops.tax.effectiveFromHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("pages.shops.tax.effectiveTo")}</Label>
                <Input
                  type="datetime-local"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {t("pages.shops.tax.effectiveToHint")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("pages.shops.tax.taxLines")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("pages.shops.tax.addLine")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("pages.shops.tax.taxLinesHint")}
              </p>
              <div className="space-y-3 rounded-md border p-3">
                {rules.map((r, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 border-b pb-3 last:border-0 last:pb-0 xl:grid xl:grid-cols-12 xl:items-end xl:gap-2 xl:space-y-0"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:contents">
                    <div className="space-y-1 min-w-0 xl:col-span-2">
                      <Label className="text-xs">
                        {t("pages.shops.tax.code")}
                      </Label>
                      <Input
                        className="w-full min-w-0"
                        value={r.code}
                        onChange={(e) =>
                          updateRule(idx, "code", e.target.value)
                        }
                        placeholder="VAT"
                      />
                    </div>
                    <div className="space-y-1 min-w-0 xl:col-span-3">
                      <Label className="text-xs">
                        {t("pages.shops.tax.label")}
                      </Label>
                      <Input
                        className="w-full min-w-0"
                        value={r.label}
                        onChange={(e) =>
                          updateRule(idx, "label", e.target.value)
                        }
                        required
                      />
                    </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:contents">
                      <div className="space-y-1 min-w-0 xl:col-span-2">
                      <Label className="text-xs">
                        {t("pages.shops.tax.type")}
                      </Label>
                      <Select
                        value={r.type}
                        onValueChange={(v) => updateRule(idx, "type", v)}
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">
                            {t("pages.shops.tax.typePercent")}
                          </SelectItem>
                          <SelectItem value="FIXED">
                            {t("pages.shops.tax.typeFixed")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                      <div className="space-y-1 min-w-0 xl:col-span-2">
                      <Label className="text-xs">
                        {t("pages.shops.tax.value")}
                      </Label>
                      <Input
                        className="w-full min-w-0"
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
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 xl:col-span-3 xl:pb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Switch
                          className="shrink-0"
                          checked={r.applyOnPreviousTaxes}
                          onCheckedChange={(c) =>
                            updateRule(idx, "applyOnPreviousTaxes", c)
                          }
                        />
                        <span className="text-xs text-muted-foreground leading-snug">
                          {t("pages.shops.tax.stackTax")}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeRule(idx)}
                        disabled={rules.length <= 1}
                        aria-label={t("pages.shops.tax.removeLineAria")}
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
              {t("pages.shops.tax.savePolicy")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
