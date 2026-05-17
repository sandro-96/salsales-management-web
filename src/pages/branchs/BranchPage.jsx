import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import axiosInstance from "../../api/axiosInstance.js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Clock,
  Users,
  Star,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { BranchListStatCards } from "@/components/branches/BranchListStatCards.jsx";
import {
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

const matchBranchSegment = (branch, segment) => {
  if (segment === "ALL") return true;
  if (segment === "ACTIVE") return Boolean(branch.active);
  if (segment === "INACTIVE") return !branch.active;
  if (segment === "DEFAULT") return Boolean(branch.default);
  return true;
};

const formatBranchTime = (value) => {
  if (!value) return null;
  if (typeof value === "string" && value.includes(":")) return value.slice(0, 5);
  return value;
};

const BranchPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { selectedShopId, branches, fetchBranches, isOwner } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canManage = hasShopPermission(PERM.BRANCH_MANAGE);
  const canDelete = isOwner;
  const shopId = selectedShopId;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const navigate = useNavigate();
  const { confirm } = useAlertDialog();
  const debounceRef = useRef(null);

  const loadBranches = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      await fetchBranches(shopId);
    } finally {
      setLoading(false);
    }
  }, [shopId, fetchBranches]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(value), 400);
  };

  const handleDelete = useCallback(
    async (branch) => {
      if (!branch) return;
      const ok = await confirm(
        t("pages.branches.list.deleteConfirm", { name: branch.name }),
        {
          title: t("pages.branches.list.deleteTitle"),
          confirmText: t("pages.branches.list.deleteConfirmBtn"),
          cancelText: t("pages.branches.list.cancel"),
          variant: "destructive",
        },
      );
      if (!ok) return;
      try {
        setIsSubmitting(true);
        const res = await axiosInstance.delete(
          `branches/${branch.id}?shopId=${shopId}`,
        );
        if (res.data.success) {
          toast.success(t("pages.branches.list.deleteSuccess"));
          await fetchBranches?.(shopId);
        } else {
          toast.error(res.data.message || t("pages.branches.list.deleteFail"));
        }
      } catch {
        toast.error(t("pages.branches.list.deleteError"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirm, t, shopId, fetchBranches],
  );

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.active).length;
    const inactive = total - active;
    const defaultCount = branches.filter((b) => b.default).length;
    return { total, active, inactive, defaultCount };
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const kw = debouncedKeyword.trim().toLowerCase();
    return branches.filter((b) => {
      if (!matchBranchSegment(b, segmentFilter)) return false;
      if (!kw) return true;
      return (
        b.name?.toLowerCase().includes(kw) ||
        b.address?.toLowerCase().includes(kw) ||
        b.phone?.toLowerCase().includes(kw) ||
        b.managerName?.toLowerCase().includes(kw)
      );
    });
  }, [branches, debouncedKeyword, segmentFilter]);

  const hasActiveFilters =
    segmentFilter !== "ALL" || debouncedKeyword.trim().length > 0;

  const clearFilters = () => {
    setSegmentFilter("ALL");
    setKeyword("");
    setDebouncedKeyword("");
  };

  const renderBranchActions = useCallback(
    (branch, { Item, Label, Separator }) => {
      const isDefault = branch.default;
      return (
        <>
          <Label>{t("pages.branches.list.actions")}</Label>
          <Separator />
          <Item onClick={() => navigate(branch.slug)}>
            <Eye className="h-4 w-4 mr-2" />
            {t("pages.branches.list.viewDetail")}
          </Item>
          {canManage && (
            <Item onClick={() => navigate(`${branch.slug}?mode=edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("pages.branches.list.edit")}
            </Item>
          )}
          {!isDefault && canDelete && (
            <>
              <Separator />
              <Item
                className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                disabled={isSubmitting}
                onClick={() => handleDelete(branch)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("pages.branches.list.delete")}
              </Item>
            </>
          )}
        </>
      );
    },
    [t, navigate, canManage, canDelete, isSubmitting, handleDelete],
  );

  const defaultBranch = filteredBranches.find((b) => b.default);
  const otherBranches = filteredBranches.filter((b) => !b.default);

  const emptyTitle = hasActiveFilters
    ? t("pages.branches.list.emptyFilter")
    : debouncedKeyword.trim()
      ? t("pages.branches.list.emptySearchTitle")
      : t("pages.branches.list.emptyTitle");

  const emptyHint = hasActiveFilters
    ? t("pages.branches.list.emptyFilterHint")
    : debouncedKeyword.trim()
      ? t("pages.branches.list.emptySearchHint")
      : t("pages.branches.list.emptyHint");

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4 min-w-0">
        <ListPageHeader
          icon={Building2}
          title={t("pages.branches.list.title")}
          subtitle={t("pages.branches.list.subtitle")}
          actions={
            canManage ? (
              <Button
                onClick={() => navigate("create")}
                size="sm"
                variant="success"
                className="shrink-0 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("pages.branches.list.addBranch")}
              </Button>
            ) : null
          }
        />

        <BranchListStatCards
          stats={stats}
          activeFilter={segmentFilter}
          loading={loading && branches.length === 0}
          numberLocale={numberLocale}
          onFilterChange={setSegmentFilter}
        />

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={listSearchWrap}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.branches.list.searchPlaceholder")}
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          <div className={listToolbarActions}>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={clearFilters}
              >
                {t("pages.branches.list.clearFilters")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={loading}
              onClick={loadBranches}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("pages.branches.list.refresh")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="py-0 gap-0">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{emptyHint}</p>
            {!hasActiveFilters && !debouncedKeyword.trim() && canManage && (
              <Button className="mt-4" variant="success" onClick={() => navigate("create")}>
                <Plus className="h-4 w-4 mr-1" />
                {t("pages.branches.list.createBranch")}
              </Button>
            )}
            {hasActiveFilters && (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                {t("pages.branches.list.clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {defaultBranch && (
              <BranchCard
                branch={defaultBranch}
                isHero
                onNavigate={(slug) => navigate(slug)}
                renderActions={renderBranchActions}
              />
            )}
            {otherBranches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {otherBranches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    onNavigate={(slug) => navigate(slug)}
                    renderActions={renderBranchActions}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BranchCard = ({
  branch,
  isHero,
  onNavigate,
  renderActions,
}) => {
  const { t } = useTranslation();
  const isActive = branch.active;
  const isDefault = branch.default;

  const opening = formatBranchTime(branch.openingTime);
  const closing = formatBranchTime(branch.closingTime);
  const hasHours = opening && closing;

  const card = (
    <Card
      className={[
        "group relative py-0 gap-0 transition-all cursor-pointer hover:shadow-md",
        isHero
          ? "border-primary/30 bg-primary/[0.02]"
          : "",
        !isActive ? "opacity-70" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onNavigate(branch.slug)}
    >
      <CardContent className={isHero ? "p-6" : "p-5"}>
        <div
          className={
            isHero
              ? "flex flex-col sm:flex-row sm:items-start gap-5"
              : "flex flex-col gap-4"
          }
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={[
                "flex items-center justify-center rounded-xl shrink-0",
                isHero ? "h-14 w-14" : "h-11 w-11",
                isActive
                  ? isDefault
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                    : "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
                  : "bg-gray-100 text-gray-400 dark:bg-muted dark:text-muted-foreground",
              ].join(" ")}
            >
              {isDefault ? (
                <Star className={isHero ? "h-6 w-6" : "h-5 w-5"} />
              ) : (
                <Building2 className={isHero ? "h-6 w-6" : "h-5 w-5"} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold truncate ${isHero ? "text-lg" : "text-sm"}`}
                >
                  {branch.name}
                </h3>
                {isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-amber-600 border-amber-300 px-1.5 py-0 dark:text-amber-300 dark:border-amber-500/40"
                  >
                    {t("pages.branches.list.defaultBadge")}
                  </Badge>
                )}
                {isActive ? (
                  <Badge className="text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {t("pages.branches.list.active")}
                  </Badge>
                ) : (
                  <Badge className="text-[10px] gap-0.5 bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted">
                    <XCircle className="h-2.5 w-2.5" />
                    {t("pages.branches.list.inactive")}
                  </Badge>
                )}
              </div>

              <div
                className={`flex flex-col gap-1 mt-2 ${isHero ? "sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1" : ""}`}
              >
                {branch.address && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{branch.address}</span>
                  </span>
                )}
                {branch.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {branch.phone}
                  </span>
                )}
                {hasHours && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {opening} – {closing}
                  </span>
                )}
                {branch.managerName && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{branch.managerName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 shrink-0 self-start"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity"
                >
                  <span className="sr-only">
                    {t("pages.branches.list.openMenu")}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-44">
                {renderActions(branch, {
                  Item: DropdownMenuItem,
                  Label: DropdownMenuLabel,
                  Separator: DropdownMenuSeparator,
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent className="bg-background w-44">
        {renderActions(branch, {
          Item: ContextMenuItem,
          Label: ContextMenuLabel,
          Separator: ContextMenuSeparator,
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BranchPage;
