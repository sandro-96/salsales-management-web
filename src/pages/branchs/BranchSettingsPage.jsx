"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Package,
  Users,
  ShoppingCart,
  BarChart2,
  Settings,
  Trash2,
  ChevronRight,
  Loader2,
  Building2,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Wifi,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import BranchForm from "./BranchForm";
import BranchProductPanel from "./BranchProductPanel";
import { useShop } from "../../hooks/useShop";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useAlertDialog } from "../../hooks/useAlertDialog";
import { getBranchBySlug } from "@/api/branchApi";
import { getBranchProducts } from "@/api/productApi";
import axiosInstance from "../../api/axiosInstance";
import { resolvePhones } from "@/utils/phoneContactUtils.js";
import { PhoneNumbersDisplay } from "@/components/common/PhoneNumbersDisplay.jsx";

const BranchSettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm } = useAlertDialog();
  const { slug } = useParams();
  const { fetchBranches, selectedShop, isOwner } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canUpdate = hasShopPermission(PERM.BRANCH_MANAGE);
  const canDelete = isOwner;

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [activeService, setActiveService] = useState("products");
  const [productCount, setProductCount] = useState(null);
  const prevShopIdRef = useRef(null);

  /* ── Navigate away when shop changes ───────────────────────────────────── */
  useEffect(() => {
    if (prevShopIdRef.current === null) {
      prevShopIdRef.current = selectedShop?.id ?? null;
      return;
    }
    if (selectedShop?.id !== prevShopIdRef.current) {
      navigate("/branches");
    }
    prevShopIdRef.current = selectedShop?.id ?? null;
  }, [selectedShop, navigate]);

  /* ── Fetch branch ───────────────────────────────────────────────────────── */
  const fetchBranch = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!slug || !selectedShop) return;
    try {
      if (!silent) setLoading(true);
      const res = await getBranchBySlug(slug, selectedShop.id);
      if (res.data.success) {
        setBranch(res.data.data);
      } else {
        setBranch(null);
        toast.error(t("pages.branches.settings.notFound"));
      }
    } catch (err) {
      console.error("Fetch branch error:", err);
      setBranch(null);
      toast.error(t("pages.branches.settings.fetchError"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [slug, selectedShop, t]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  /* ── Fetch product count for stats card ─────────────────────────────────── */
  useEffect(() => {
    if (!branch || !selectedShop) return;
    getBranchProducts(selectedShop.id, branch.id, { page: 0, size: 1 })
      .then((res) => {
        const data = res.data?.data;
        const total =
          data?.page?.totalElements ??
          data?.totalElements ??
          (Array.isArray(data) ? data.length : null);
        setProductCount(total);
      })
      .catch(() => setProductCount(null));
  }, [branch, selectedShop]);

  /* ── Update branch ───────────────────────────────────────────────────────── */
  const onSubmit = async (data) => {
    if (!branch) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.put(
        `branches/${branch.id}?shopId=${selectedShop.id}`,
        data,
      );
      if (res.data.success) {
        toast.success(t("pages.branches.settings.updateSuccess"));
        await fetchBranches?.();
        await fetchBranch({ silent: true });
        setEditSheetOpen(false);
      } else {
        toast.error(
          res.data.message || t("pages.branches.settings.updateFail"),
        );
      }
    } catch (err) {
      console.error("Update branch error:", err);
      toast.error(t("pages.branches.settings.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Delete branch ───────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!branch) return;
    const ok = await confirm(t("pages.branches.settings.deleteConfirm"), {
      title: t("pages.branches.settings.deleteTitle"),
      confirmText: t("pages.branches.settings.deleteConfirmBtn"),
      cancelText: t("pages.branches.settings.cancel"),
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.delete(
        `branches/${branch.id}?shopId=${branch.shopId}`,
      );
      if (res.data.success) {
        toast.success(t("pages.branches.settings.deleteSuccess"));
        await fetchBranches?.();
        navigate(-1);
      } else {
        toast.error(
          res.data.message || t("pages.branches.settings.deleteFail"),
        );
      }
    } catch (err) {
      console.error("Delete branch error:", err);
      toast.error(t("pages.branches.settings.deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Loading / not found ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-12">
        <Building2 className="h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">
          {t("pages.branches.settings.notFound")}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("pages.branches.settings.back")}
        </Button>
      </div>
    );
  }

  /* ── Service card definitions ───────────────────────────────────────────── */
  const formatBranchDate = (value) => {
    if (value == null || value === "") return null;
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(d) ? format(d, "dd/MM/yyyy") : null;
  };

  const formatBranchTime = (value) => {
    if (value == null || value === "") return null;
    if (typeof value === "string") {
      const m = value.match(/^(\d{1,2}):(\d{2})/);
      return m ? `${m[1].padStart(2, "0")}:${m[2]}` : value;
    }
    return String(value);
  };

  const notUpdated = t("pages.branches.settings.notUpdated");

  const services = [
    {
      id: "products",
      icon: Package,
      title: t("pages.branches.settings.serviceProducts"),
      description: t("pages.branches.settings.serviceProductsDesc"),
      count: productCount,
      available: true,
    },
    {
      id: "orders",
      icon: ShoppingCart,
      title: t("pages.branches.settings.serviceOrders"),
      description: t("pages.branches.settings.serviceOrdersDesc"),
      count: null,
      available: true,
    },
    {
      id: "staffs",
      icon: Users,
      title: t("pages.branches.settings.serviceStaffs"),
      description: t("pages.branches.settings.serviceStaffsDesc"),
      count: null,
      available: true,
    },
    {
      id: "reports",
      icon: BarChart2,
      title: t("pages.branches.settings.serviceReports"),
      description: t("pages.branches.settings.serviceReportsDesc"),
      count: null,
      available: true,
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 py-4 sm:gap-6 sm:p-6">
      {/* Branch info header card */}
      <div className="flex min-w-0 max-w-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-xl font-bold tracking-tight sm:text-2xl">
              {branch.name}
            </h1>
            {branch.default && (
              <Badge
                variant="outline"
                className="text-xs font-normal text-amber-600 border-amber-400"
              >
                {t("pages.branches.settings.defaultBadge")}
              </Badge>
            )}
            <Badge
              className={`text-xs border ${
                branch.active
                  ? "bg-green-100 text-green-700 border-green-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40"
                  : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border"
              }`}
            >
              {branch.active
                ? t("pages.branches.settings.active")
                : t("pages.branches.settings.inactive")}
            </Badge>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {branch.address && (
              <span className="flex items-start gap-2 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{branch.address}</span>
              </span>
            )}
            {resolvePhones(branch).some((p) => p.trim()) && (
              <div className="min-w-0 pl-0">
                <PhoneNumbersDisplay
                  phones={resolvePhones(branch)}
                  variant="inline"
                />
              </div>
            )}
            <span className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="text-foreground/90 min-w-0">
                {t("pages.branches.settings.openingDate")}{" "}
                <span className="font-medium text-foreground">
                  {formatBranchDate(branch.openingDate) ?? notUpdated}
                </span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground/90">
                {t("pages.branches.settings.openingHours")}{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatBranchTime(branch.openingTime) ?? notUpdated}
                </span>
                <span className="mx-1 text-muted-foreground">–</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatBranchTime(branch.closingTime) ?? notUpdated}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {t("pages.branches.settings.hours24")}
                </span>
              </span>
            </span>
            <span className="flex items-start gap-2 min-w-0">
              <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="text-foreground/90 min-w-0">
                {t("pages.branches.settings.description")}{" "}
                <span className="font-medium text-foreground break-words">
                  {branch.description?.trim()
                    ? branch.description.trim()
                    : notUpdated}
                </span>
              </span>
            </span>
            <span className="flex items-start gap-2 min-w-0">
              <Wifi className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="text-foreground/90 min-w-0">
                {t("pages.branches.settings.guestWifi")}{" "}
                <span className="font-medium text-foreground break-all">
                  {branch.wifiSsid?.trim()
                    ? branch.wifiSsid.trim()
                    : notUpdated}
                </span>
                {branch.wifiSsid?.trim() && branch.wifiPassword ? (
                  <span className="text-muted-foreground">
                    {t("pages.branches.settings.wifiPasswordSet")}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="flex items-start gap-2 min-w-0">
              <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="text-foreground/90 min-w-0">
                {t("pages.branches.settings.invoiceLocale")}{" "}
                <span className="font-medium text-foreground">
                  {t(
                    `pages.branches.form.invoiceLocaleOption.${
                      branch.invoiceLocale === "en" ||
                      branch.invoiceLocale?.startsWith?.("en")
                        ? "en"
                        : "vi"
                    }`,
                  )}
                </span>
              </span>
            </span>
            {branch.managerName && (
              <span className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground/90">
                  {t("pages.branches.settings.manager")}{" "}
                  <span className="font-medium text-foreground">
                    {branch.managerName}
                  </span>
                  {branch.managerPhone ? (
                    <span className="tabular-nums">
                      {" "}
                      · {branch.managerPhone}
                    </span>
                  ) : null}
                </span>
              </span>
            )}
            {branch.capacity != null && branch.capacity > 0 && (
              <span className="text-foreground/90">
                {t("pages.branches.settings.capacity")}{" "}
                <span className="font-medium text-foreground">
                  {branch.capacity}
                </span>{" "}
                {t("pages.branches.settings.capacityUnit")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!branch.default && canDelete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5">
                {t("pages.branches.settings.deleteBtn")}
              </span>
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditSheetOpen(true)}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="ml-1.5">
                {t("pages.branches.settings.settingsBtn")}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Service cards grid */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {services.map((svc) => {
          const Icon = svc.icon;
          const isActive = activeService === svc.id;
          return (
            <div
              key={svc.id}
              onClick={() => {
                if (!svc.available) return;
                if (svc.id === "products") {
                  setActiveService(isActive ? null : svc.id);
                  return;
                }
                const qp = `?branchId=${encodeURIComponent(branch.id)}`;
                if (svc.id === "orders") navigate(`/orders${qp}`);
                if (svc.id === "reports") navigate(`/reports${qp}`);
                if (svc.id === "staffs") navigate(`/staffs${qp}`);
              }}
              className={[
                "relative flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-all select-none sm:p-5",
                svc.available
                  ? isActive
                    ? "cursor-pointer border-2 border-primary shadow-md bg-primary/5 ring-1 ring-primary/20"
                    : "cursor-pointer bg-card hover:border-primary/50 hover:shadow-sm"
                  : "opacity-55 cursor-not-allowed bg-muted/40",
              ].join(" ")}
            >
              {!svc.available && (
                <Badge
                  variant="secondary"
                  className="absolute top-3 right-3 text-[10px] px-1.5 py-0"
                >
                  {t("pages.branches.settings.comingSoon")}
                </Badge>
              )}

              <div
                className={`p-2.5 rounded-lg w-fit ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="truncate text-sm font-semibold">{svc.title}</div>
                {svc.count != null && (
                  <div className="text-2xl font-bold tabular-nums leading-tight">
                    {svc.count}
                  </div>
                )}
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {svc.description}
                </div>
              </div>

              {svc.available && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium mt-auto ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isActive
                    ? t("pages.branches.settings.viewing")
                    : t("pages.branches.settings.manage")}
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isActive ? "rotate-90" : ""
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active service panel */}
      {activeService === "products" && (
        <div className="flex min-w-0 max-w-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="min-w-0 text-base font-semibold">
            <span className="break-words">
              {t("pages.branches.settings.branchProductsTitle")}{" "}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              — {branch.name}
            </span>
          </h3>
          <BranchProductPanel
            shopId={selectedShop.id}
            branchId={branch.id}
            onCountChange={setProductCount}
          />
        </div>
      )}

      {/* Edit Branch Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full overflow-hidden flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 px-6 pt-6 pb-2 border-b border-border/60">
            <SheetTitle>{t("pages.branches.settings.sheetTitle")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("pages.branches.settings.sheetDesc")}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
            <BranchForm
              mode="edit"
              branch={branch}
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              onModeChange={(newMode) => {
                if (newMode === "view") setEditSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BranchSettingsPage;
