import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useAuth } from "../../hooks/useAuth.js";
import axiosInstance from "../../api/axiosInstance";
import { deleteShop } from "../../api/shopApi.js";
import { toast } from "sonner";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { useNavigate, Link } from "react-router-dom";
import {
  isProductImageFile,
  prepareProductImageFile,
} from "@/utils/productImageFiles.js";
import {
  Store,
  Pencil,
  X,
  Save,
  Loader2,
  Camera,
  MapPin,
  Phone,
  Globe,
  Trash2,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  Link2,
  Copy,
  Percent,
  IdCard,
  ShoppingBag,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { useOrderAlertSound } from "@/hooks/useOrderAlertSound.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/constants/countries";
import { cn } from "@/lib/utils";
import { getFlagUrl } from "@/utils/commonUtils";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getBusinessModelLabel,
  getShopTypeLabel,
} from "@/utils/shopLabels";
import { SHOP_INDUSTRY } from "@/constants/ShopIndustry.js";
import { PhoneNumbersField } from "@/components/common/PhoneNumbersField.jsx";
import { PhoneNumbersDisplay } from "@/components/common/PhoneNumbersDisplay.jsx";
import {
  normalizePhoneInputs,
  resolvePhones,
} from "@/utils/phoneContactUtils.js";

function subscriptionPillClass(status) {
  switch (status) {
    case "TRIAL":
      return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/40";
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40";
    case "EXPIRED":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/40";
    case "CANCELLED":
      return "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700/50 dark:text-slate-200 dark:border-slate-600";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border";
  }
}

function subscriptionPillLabel(sub, t, { loading, error } = {}) {
  if (loading) return t("pages.shops.subscription.loading");
  if (error || !sub?.status) return t("pages.shops.subscription.unavailable");
  if (sub.status === "TRIAL") {
    return t("pages.shops.subscription.trialPill", {
      days: sub.trialDaysRemaining ?? 0,
    });
  }
  if (sub.status === "ACTIVE") {
    return t("pages.shops.subscription.activePill", {
      days: sub.periodDaysRemaining ?? 0,
    });
  }
  if (sub.status === "EXPIRED") return t("pages.shops.subscription.expiredPill");
  if (sub.status === "CANCELLED")
    return t("pages.shops.subscription.cancelledPill");
  return sub.status;
}

const ShopSettingsPage = () => {
  const { t } = useTranslation();
  const { confirm } = useAlertDialog();
  const { enums } = useAuth();
  const { selectedShop, setSelectedShop, fetchShops, isOwner, selectedIndustry } =
    useShop();
  const shopHasTableManagement = selectedIndustry === SHOP_INDUSTRY.FNB;
  const {
    data: subscription,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription({
    enabled: Boolean(selectedShop?.id),
    shopId: selectedShop?.id,
  });
  const { hasShopPermission } = useShopPermissions();
  const canManageTax = hasShopPermission(PERM.SHOP_UPDATE);
  const canDeleteShop = hasShopPermission(PERM.SHOP_DELETE);
  const canViewOrders = hasShopPermission(PERM.ORDER_VIEW);
  const {
    enabled: orderSoundEnabled,
    setSoundEnabled: setOrderSoundEnabled,
    testSound,
  } = useOrderAlertSound();
  const showSubscriptionStatus = isOwner;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const navigate = useNavigate();

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [address, setAddress] = useState("");
  const [phones, setPhones] = useState([""]);
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState("");
  const [zaloPageUrl, setZaloPageUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [active, setActive] = useState(true);
  const [toppingsEnabled, setToppingsEnabled] = useState(false);
  const [onlineSalesEnabled, setOnlineSalesEnabled] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [tableOrderingEnabled, setTableOrderingEnabled] = useState(false);
  const [togglingTableOrdering, setTogglingTableOrdering] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const resetForm = useCallback(() => {
    if (!selectedShop) return;
    setName(selectedShop.name || "");
    setType(selectedShop.type || "");
    setBusinessModel(selectedShop.businessModel || "");
    setAddress(selectedShop.address || "");
    setPhones(resolvePhones(selectedShop));
    setTaxRegistrationNumber(selectedShop.taxRegistrationNumber || "");
    setZaloPageUrl(selectedShop.zaloPageUrl || "");
    setFacebookUrl(selectedShop.facebookUrl || "");
    setTiktokUrl(selectedShop.tiktokUrl || "");
    setShopeeUrl(selectedShop.shopeeUrl || "");
    setCountryCode(selectedShop.countryCode || "VN");
    setActive(selectedShop.active !== false);
    setToppingsEnabled(selectedShop.toppingsEnabled === true);
    setOnlineSalesEnabled(selectedShop.onlineSalesEnabled === true);
    setTableOrderingEnabled(selectedShop.tableOrderingEnabled === true);
    setLogoFile(null);
    setLogoPreview(null);
    setAttemptedSubmit(false);
  }, [selectedShop]);

  useEffect(() => {
    if (selectedShop) {
      resetForm();
    }
  }, [selectedShop, resetForm]);

  const cancelEdit = () => {
    setIsEditMode(false);
    resetForm();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isProductImageFile(file)) {
      toast.error(t("pages.shops.settings.imageTypeError"));
      return;
    }
    const tid =
      file.size > 5 * 1024 * 1024
        ? toast.loading(t("pages.shops.settings.compressing"))
        : null;
    try {
      const processed = await prepareProductImageFile(file);
      setLogoFile(processed);
      setLogoPreview(URL.createObjectURL(processed));
      if (tid) {
        toast.success(t("pages.shops.settings.compressSuccess"), { id: tid });
      }
    } catch {
      if (tid) toast.error(t("pages.shops.settings.compressFail"), { id: tid });
      else toast.error(t("pages.shops.settings.compressFail"));
    }
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!name.trim()) {
      toast.error(t("pages.shops.settings.nameRequiredToast"));
      return;
    }
    try {
      setIsSubmitting(true);
      const normalizedPhones = normalizePhoneInputs(phones);
      if (normalizedPhones.length === 0) {
        toast.error(t("pages.shops.form.phoneRequired"));
        return;
      }
      const data = {
        name: name.trim(),
        type,
        businessModel,
        address: address.trim(),
        phone: normalizedPhones[0],
        phones: normalizedPhones,
        taxRegistrationNumber: taxRegistrationNumber.trim() || null,
        zaloPageUrl: zaloPageUrl.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        tiktokUrl: tiktokUrl.trim() || null,
        shopeeUrl: shopeeUrl.trim() || null,
        countryCode,
        active,
        toppingsEnabled,
        onlineSalesEnabled,
        tableOrderingEnabled,
      };
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
      );
      if (logoFile) formData.append("file", logoFile);

      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.data.success) {
        toast.success(t("pages.shops.settings.updateSuccess"));
        const response = res.data.data;
        response.role = selectedShop.role;
        setSelectedShop(response);
        await fetchShops();
        setIsEditMode(false);
      } else {
        toast.error(res.data.message || t("pages.shops.settings.updateFail"));
      }
    } catch (err) {
      toast.error(t("pages.shops.settings.updateError"));
      console.error("Error updating shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShop) return;
    const ok = await confirm(t("pages.shops.settings.deleteConfirm"), {
      title: t("pages.shops.settings.deleteTitle"),
      confirmText: t("pages.shops.settings.deleteConfirmBtn"),
      cancelText: t("pages.shops.settings.cancel"),
      variant: "destructive",
    });
    if (!ok) return;

    try {
      setIsSubmitting(true);
      const res = await deleteShop(selectedShop.id);
      if (res.data.success) {
        toast.success(t("pages.shops.settings.deleteSuccess"));
        setSelectedShop(null);
        await fetchShops();
        navigate("/shops");
      } else {
        toast.error(res.data.message || t("pages.shops.settings.deleteFail"));
      }
    } catch (err) {
      toast.error(t("pages.shops.settings.deleteError"));
      console.error("Error deleting shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySlug = () => {
    if (selectedShop?.slug) {
      navigator.clipboard
        .writeText(selectedShop.slug)
        .then(() => toast.success(t("pages.shops.settings.copySlugSuccess")))
        .catch(() => toast.error(t("pages.shops.settings.copyFail")));
    }
  };

  const storefrontUrl =
    selectedShop?.slug && typeof window !== "undefined"
      ? `${window.location.origin}/s/${selectedShop.slug}`
      : "";

  const copyStorefrontUrl = () => {
    if (!storefrontUrl) return;
    navigator.clipboard
      .writeText(storefrontUrl)
      .then(() => toast.success(t("pages.shops.settings.copyStorefrontSuccess")))
      .catch(() => toast.error(t("pages.shops.settings.copyFail")));
  };

  const toggleOnlineSales = async (nextValue) => {
    if (!selectedShop) return;
    if (!selectedShop.slug) {
      toast.error(t("pages.shops.settings.noSlugOnline"));
      return;
    }
    try {
      setTogglingOnline(true);
      const data = {
        name: selectedShop.name || "",
        type: selectedShop.type,
        businessModel: selectedShop.businessModel,
        address: selectedShop.address || "",
        phone: resolvePhones(selectedShop)[0] || "",
        phones: normalizePhoneInputs(resolvePhones(selectedShop)),
        taxRegistrationNumber: selectedShop.taxRegistrationNumber || null,
        zaloPageUrl: selectedShop.zaloPageUrl || null,
        facebookUrl: selectedShop.facebookUrl || null,
        tiktokUrl: selectedShop.tiktokUrl || null,
        shopeeUrl: selectedShop.shopeeUrl || null,
        countryCode: selectedShop.countryCode || "VN",
        active: selectedShop.active !== false,
        toppingsEnabled: selectedShop.toppingsEnabled === true,
        onlineSalesEnabled: nextValue,
        tableOrderingEnabled: selectedShop.tableOrderingEnabled === true,
      };
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
      );
      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.data.success) {
        const response = res.data.data;
        response.role = selectedShop.role;
        setSelectedShop(response);
        setOnlineSalesEnabled(response.onlineSalesEnabled === true);
        await fetchShops();
        toast.success(
          nextValue
            ? t("pages.shops.settings.onlineEnabled")
            : t("pages.shops.settings.onlineDisabled"),
        );
      } else {
        toast.error(res.data.message || t("pages.shops.settings.updateFail"));
      }
    } catch (err) {
      toast.error(t("pages.shops.settings.toggleError"));
      console.error("Error toggling online sales:", err);
    } finally {
      setTogglingOnline(false);
    }
  };

  const toggleTableOrdering = async (nextValue) => {
    if (!selectedShop) return;
    if (!selectedShop.slug) {
      toast.error(t("pages.shops.settings.noSlugTable"));
      return;
    }
    try {
      setTogglingTableOrdering(true);
      const data = {
        name: selectedShop.name || "",
        type: selectedShop.type,
        businessModel: selectedShop.businessModel,
        address: selectedShop.address || "",
        phone: resolvePhones(selectedShop)[0] || "",
        phones: normalizePhoneInputs(resolvePhones(selectedShop)),
        taxRegistrationNumber: selectedShop.taxRegistrationNumber || null,
        zaloPageUrl: selectedShop.zaloPageUrl || null,
        facebookUrl: selectedShop.facebookUrl || null,
        tiktokUrl: selectedShop.tiktokUrl || null,
        shopeeUrl: selectedShop.shopeeUrl || null,
        countryCode: selectedShop.countryCode || "VN",
        active: selectedShop.active !== false,
        toppingsEnabled: selectedShop.toppingsEnabled === true,
        onlineSalesEnabled: selectedShop.onlineSalesEnabled === true,
        tableOrderingEnabled: nextValue,
      };
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
      );
      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.data.success) {
        const response = res.data.data;
        response.role = selectedShop.role;
        setSelectedShop(response);
        setTableOrderingEnabled(response.tableOrderingEnabled === true);
        await fetchShops();
        toast.success(
          nextValue
            ? t("pages.shops.settings.tableOrderingEnabled")
            : t("pages.shops.settings.tableOrderingDisabled"),
        );
      } else {
        toast.error(res.data.message || t("pages.shops.settings.updateFail"));
      }
    } catch (err) {
      toast.error(t("pages.shops.settings.toggleError"));
      console.error("Error toggling table ordering:", err);
    } finally {
      setTogglingTableOrdering(false);
    }
  };

  if (!selectedShop) return null;

  const country = COUNTRIES.find((c) => c.code === (isEditMode ? countryCode : selectedShop.countryCode)) || COUNTRIES[0];
  const shopTypeHit = shopTypes.find((s) => s.value === selectedShop.type);
  const bizModelHit = businessModels.find(
    (b) => b.value === selectedShop.businessModel,
  );
  const shopTypeLabel = getShopTypeLabel(
    t,
    selectedShop.type,
    shopTypeHit?.label,
  );
  const bizModelLabel = getBusinessModelLabel(
    t,
    selectedShop.businessModel,
    bizModelHit?.label,
  );
  const subscriptionPillCls = subscriptionPillClass(subscription?.status);
  const logoSrc = logoPreview || selectedShop.logoUrl;

  return (
    <div className="flex-1 flex-col gap-6 p-4 md:p-8 md:flex max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("pages.shops.settings.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("pages.shops.settings.subtitle")}
        </p>
      </div>

      {canManageTax && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {t("pages.shops.settings.taxCardTitle")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pages.shops.settings.taxCardDesc")}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" asChild>
              <Link to="/tax-policies">
                {t("pages.shops.settings.openTaxSettings")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {canManageTax && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              {t("pages.shops.settings.storefrontTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pages.shops.settings.storefrontDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {onlineSalesEnabled
                    ? t("pages.shops.settings.storefrontOn")
                    : t("pages.shops.settings.storefrontOff")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pages.shops.settings.storefrontOrdersHint")}
                </p>
              </div>
              <Switch
                checked={onlineSalesEnabled}
                onCheckedChange={(v) => toggleOnlineSales(v)}
                disabled={togglingOnline || !selectedShop?.slug}
                className="shrink-0"
              />
            </div>

            {!selectedShop?.slug && (
              <p className="text-xs text-amber-600">
                {t("pages.shops.settings.noSlugWarning")}
              </p>
            )}

            {onlineSalesEnabled && storefrontUrl && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />{" "}
                  {t("pages.shops.settings.publicStorefrontUrl")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={storefrontUrl}
                    readOnly
                    className="font-mono text-xs h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyStorefrontUrl}
                    title={t("pages.shops.settings.copy")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    title={t("pages.shops.settings.viewStorefront")}
                  >
                    <a
                      href={storefrontUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("pages.shops.settings.shareStorefrontHint")}
                </p>
              </div>
            )}

            {shopHasTableManagement && (
            <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {tableOrderingEnabled
                    ? t("pages.shops.settings.tableOrderingOn")
                    : t("pages.shops.settings.tableOrderingOff")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pages.shops.settings.tableOrderingHint")}
                </p>
              </div>
              <Switch
                checked={tableOrderingEnabled}
                onCheckedChange={(v) => toggleTableOrdering(v)}
                disabled={togglingTableOrdering || !selectedShop?.slug}
                className="shrink-0"
              />
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {canViewOrders && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              {t("pages.shops.settings.orderSoundTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pages.shops.settings.orderSoundDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {orderSoundEnabled
                    ? t("pages.shops.settings.orderSoundOn")
                    : t("pages.shops.settings.orderSoundOff")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pages.shops.settings.orderSoundHint")}
                </p>
              </div>
              <Switch
                checked={orderSoundEnabled}
                onCheckedChange={setOrderSoundEnabled}
                className="shrink-0"
              />
            </div>
            {orderSoundEnabled ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testSound("ONLINE")}
                >
                  {t("pages.shops.settings.orderSoundTestOnline")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testSound("IN_STORE")}
                >
                  {t("pages.shops.settings.orderSoundTestInStore")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Shop identity card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24 rounded-xl border-2">
                <AvatarImage
                  src={logoSrc}
                  alt={selectedShop.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                  <Store className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity dark:bg-black/60">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {selectedShop.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-1.5">
                {selectedShop.active ? (
                  <Badge className="text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15">
                    <CheckCircle2 className="h-2.5 w-2.5" />{" "}
                    {t("pages.shops.settings.active")}
                  </Badge>
                ) : (
                  <Badge className="text-[10px] gap-0.5 bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted">
                    <XCircle className="h-2.5 w-2.5" />{" "}
                    {t("pages.shops.settings.inactive")}
                  </Badge>
                )}
                {showSubscriptionStatus && (
                  <Link to="/billing" className="contents">
                    <Badge
                      className={`text-[10px] gap-0.5 cursor-pointer ${subscriptionPillCls}`}
                      title={t("pages.shops.subscription.viewPlanTitle")}
                    >
                      {subscription?.status === "ACTIVE" ? (
                        <CreditCard className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      {subscriptionPillLabel(subscription, t, {
                        loading: subscriptionLoading,
                        error: subscriptionError,
                      })}
                    </Badge>
                  </Link>
                )}
                {selectedShop.slug && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
                    onClick={copySlug}
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    {selectedShop.slug}
                    <Copy className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                )}
              </div>
            </div>

            <div className="shrink-0 flex gap-2">
              {!isEditMode
                ? canManageTax && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />{" "}
                      {t("pages.shops.settings.edit")}
                    </Button>
                  )
                : (
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" />{" "}
                      {t("pages.shops.settings.cancel")}
                    </Button>
                  )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop details */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">
            {t("pages.shops.settings.shopInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <FieldWrapper label={t("pages.shops.settings.nameRequired")} icon={Store}>
            {isEditMode ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("pages.shops.settings.namePlaceholder")}
                aria-invalid={attemptedSubmit && !name.trim()}
              />
            ) : (
              <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                {selectedShop.name}
              </FieldValue>
            )}
          </FieldWrapper>

          <Separator />

          {/* Type & Business model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper
              label={t("pages.shops.settings.businessType")}
              icon={Building2}
            >
              {isEditMode ? (
                <Select
                  value={type}
                  onValueChange={(val) => {
                    setType(val);
                    const st = shopTypes.find((s) => s.value === val);
                    if (st?.defaultBusinessModel) {
                      setBusinessModel(st.defaultBusinessModel);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("pages.shops.settings.selectType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {shopTypes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {getShopTypeLabel(t, opt.value, opt.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                  {shopTypeLabel}
                </FieldValue>
              )}
            </FieldWrapper>
            <FieldWrapper
              label={t("pages.shops.settings.businessModel")}
              icon={Briefcase}
            >
              {isEditMode ? (
                <Select
                  value={businessModel}
                  onValueChange={setBusinessModel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("pages.shops.settings.selectModel")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {businessModels.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {getBusinessModelLabel(t, opt.value, opt.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                  {bizModelLabel}
                </FieldValue>
              )}
            </FieldWrapper>
          </div>

          <Separator />

          {/* Country & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label={t("pages.shops.settings.country")} icon={Globe}>
              {isEditMode ? (
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <img
                          src={getFlagUrl(countryCode)}
                          alt="flag"
                          className="w-5 h-4 rounded-sm"
                        />
                        <span>
                          {COUNTRIES.find((c) => c.code === countryCode)?.name}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <div className="flex items-center gap-2">
                          <img
                            src={getFlagUrl(c.code)}
                            alt={c.name}
                            className="w-5 h-4 rounded-sm object-cover"
                          />
                          <span>
                            {c.name} ({c.dialCode})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                  {country && (
                    <span className="flex items-center gap-2">
                      <img
                        src={getFlagUrl(country.code)}
                        alt={country.name}
                        className="w-5 h-4 rounded-sm"
                      />
                      {country.name}
                    </span>
                  )}
                </FieldValue>
              )}
            </FieldWrapper>
            <FieldWrapper
              label={t("pages.shops.settings.phone")}
              icon={Phone}
              className="sm:col-span-2"
            >
              {isEditMode ? (
                <PhoneNumbersField
                  value={phones}
                  onChange={setPhones}
                  dialCode={country.dialCode}
                />
              ) : (
                <PhoneNumbersDisplay
                  phones={resolvePhones(selectedShop)}
                  dialCode={country?.dialCode}
                  emptyLabel={t("pages.shops.settings.notUpdated")}
                />
              )}
            </FieldWrapper>
          </div>

          <Separator />

          {/* Address */}
          <FieldWrapper label={t("pages.shops.settings.address")} icon={MapPin}>
            {isEditMode ? (
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("pages.shops.settings.addressPlaceholder")}
                rows={2}
              />
            ) : (
              <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                {selectedShop.address}
              </FieldValue>
            )}
          </FieldWrapper>

          <Separator />

          <FieldWrapper label={t("pages.shops.settings.taxId")} icon={IdCard}>
            {isEditMode ? (
              <Input
                value={taxRegistrationNumber}
                onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                placeholder={t("pages.shops.settings.taxIdPlaceholder")}
                maxLength={32}
              />
            ) : (
              <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                {selectedShop.taxRegistrationNumber}
              </FieldValue>
            )}
          </FieldWrapper>
          {isEditMode && (
            <p className="text-xs text-muted-foreground -mt-2">
              {t("pages.shops.settings.taxIdHint")}
            </p>
          )}

          <Separator />

          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              {t("pages.shops.settings.socialLinks")}
            </Label>
            <p className="text-xs text-muted-foreground pb-2">
              {t("pages.shops.settings.socialLinksHint")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label={t("pages.shops.settings.zalo")}>
              {isEditMode ? (
                <Input
                  value={zaloPageUrl}
                  onChange={(e) => setZaloPageUrl(e.target.value)}
                  placeholder="https://zalo.me/..."
                />
              ) : selectedShop.zaloPageUrl ? (
                <a
                  href={selectedShop.zaloPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.zaloPageUrl}
                </a>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")} />
              )}
            </FieldWrapper>
            <FieldWrapper label={t("pages.shops.settings.facebook")}>
              {isEditMode ? (
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                />
              ) : selectedShop.facebookUrl ? (
                <a
                  href={selectedShop.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.facebookUrl}
                </a>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")} />
              )}
            </FieldWrapper>
            <FieldWrapper label={t("pages.shops.settings.tiktok")}>
              {isEditMode ? (
                <Input
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                />
              ) : selectedShop.tiktokUrl ? (
                <a
                  href={selectedShop.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.tiktokUrl}
                </a>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")} />
              )}
            </FieldWrapper>
            <FieldWrapper label={t("pages.shops.settings.shopee")}>
              {isEditMode ? (
                <Input
                  value={shopeeUrl}
                  onChange={(e) => setShopeeUrl(e.target.value)}
                  placeholder="https://shopee.vn/..."
                />
              ) : selectedShop.shopeeUrl ? (
                <a
                  href={selectedShop.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.shopeeUrl}
                </a>
              ) : (
                <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")} />
              )}
            </FieldWrapper>
          </div>

          {/* Tính năng topping — mặc định tắt; bật để cấu hình & POS */}
          <Separator />
          <FieldWrapper label={t("pages.shops.settings.toppings")}>
            {isEditMode ? (
              <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                <p className="text-sm text-muted-foreground pr-2">
                  {t("pages.shops.settings.toppingsHint")}
                </p>
                <Switch
                  checked={toppingsEnabled}
                  onCheckedChange={setToppingsEnabled}
                  className="shrink-0"
                />
              </div>
            ) : (
              <FieldValue emptyLabel={t("pages.shops.settings.notUpdated")}>
                {selectedShop.toppingsEnabled
                  ? t("pages.shops.settings.storefrontOn")
                  : t("pages.shops.settings.storefrontOff")}
              </FieldValue>
            )}
          </FieldWrapper>

          {/* Status toggle in edit mode */}
          {isEditMode && (
            <>
              <Separator />
              <FieldWrapper label={t("pages.shops.settings.activeStatus")}>
                <Select
                  value={active ? "true" : "false"}
                  onValueChange={(v) => setActive(v === "true")}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="true">
                      {t("pages.shops.settings.active")}
                    </SelectItem>
                    <SelectItem value="false">
                      {t("pages.shops.settings.inactive")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </>
          )}

          {/* Save / Delete actions */}
          {isEditMode && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                {t("pages.shops.settings.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {isSubmitting
                  ? t("pages.shops.settings.saving")
                  : t("pages.shops.settings.save")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {canDeleteShop && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-destructive">
              {t("pages.shops.settings.dangerZone")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {t("pages.shops.settings.deleteShop")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("pages.shops.settings.deleteShopHint")}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-1" />{" "}
                {t("pages.shops.settings.deleteShop")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function FieldWrapper({ label, icon: IconComp, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        {IconComp && <IconComp className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function FieldValue({ children, emptyLabel }) {
  return (
    <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 min-h-9 flex items-center">
      {children || (
        <span className="text-muted-foreground">{emptyLabel}</span>
      )}
    </p>
  );
}

export default ShopSettingsPage;
