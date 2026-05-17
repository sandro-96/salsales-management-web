import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import {
  Store,
  Plus,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES } from "../../constants/countries";
import {
  getBusinessModelLabel,
  getShopTypeLabel,
} from "../../utils/shopLabels.js";
import { ShopListStatCards } from "@/components/shops/ShopListStatCards.jsx";
import { ShopCard } from "@/components/shops/ShopCard.jsx";
import {
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

const matchShopSegment = (shop, segment) => {
  if (segment === "ALL") return true;
  if (segment === "ACTIVE") return Boolean(shop.active);
  if (segment === "INACTIVE") return !shop.active;
  if (segment === "OWNER") return shop.role === "OWNER";
  return true;
};

const ShopPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { shops, setSelectedShop, fetchShops } = useShop();
  const { enums, fetchEnums } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!enums && typeof fetchEnums === "function") fetchEnums();
  }, [enums, fetchEnums]);

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const industryLabel = useCallback(
    (industry) =>
      industry
        ? t(`pages.shops.industry.${industry}`, { defaultValue: industry })
        : null,
    [t],
  );

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(value), 400);
  };

  const stats = useMemo(
    () => ({
      total: shops.length,
      active: shops.filter((s) => s.active).length,
      inactive: shops.filter((s) => !s.active).length,
      owner: shops.filter((s) => s.role === "OWNER").length,
    }),
    [shops],
  );

  const filteredShops = useMemo(() => {
    let list = shops.filter((s) => matchShopSegment(s, segmentFilter));
    const kw = debouncedKeyword.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(kw) ||
        s.address?.toLowerCase().includes(kw) ||
        s.phone?.toLowerCase().includes(kw),
    );
  }, [shops, segmentFilter, debouncedKeyword]);

  const hasActiveFilters =
    segmentFilter !== "ALL" || Boolean(debouncedKeyword.trim());

  const clearFilters = () => {
    setSegmentFilter("ALL");
    setKeyword("");
    setDebouncedKeyword("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchShops();
    } finally {
      setRefreshing(false);
    }
  };

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    navigate(shop.slug);
  };

  const resolveShopLabels = (shop) => {
    const typeHit = shopTypes.find((s) => s.value === shop.type);
    const bizHit = businessModels.find((b) => b.value === shop.businessModel);
    return {
      country: COUNTRIES.find((c) => c.code === shop.countryCode),
      typeLabel: getShopTypeLabel(t, shop.type, typeHit?.label),
      bizLabel: getBusinessModelLabel(t, shop.businessModel, bizHit?.label),
      indLabel: industryLabel(shop.industry),
    };
  };

  const showFeatured =
    segmentFilter === "ALL" &&
    !debouncedKeyword.trim() &&
    filteredShops.length > 1;
  const featuredShop = showFeatured
    ? filteredShops.find((s) => s.active) ?? filteredShops[0]
    : null;
  const gridShops = showFeatured
    ? filteredShops.filter((s) => s.id !== featuredShop?.id)
    : filteredShops;

  const emptyTitle = hasActiveFilters
    ? t("pages.shops.list.emptyFilter")
    : debouncedKeyword.trim()
      ? t("pages.shops.list.emptySearchTitle")
      : t("pages.shops.list.emptyTitle");

  const emptyHint = hasActiveFilters
    ? t("pages.shops.list.emptyFilterHint")
    : debouncedKeyword.trim()
      ? t("pages.shops.list.emptySearchHint")
      : t("pages.shops.list.emptyHint");

  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[50vh] p-8">
        <div className="max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {t("pages.shops.list.emptyWelcome")}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {t("pages.shops.list.emptyHint")}
          </p>
          <Button onClick={() => navigate("/shops/create")} variant="success">
            <Plus className="h-4 w-4 mr-1" /> {t("pages.shops.list.createFirst")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4 min-w-0">
        <ListPageHeader
          icon={Store}
          title={t("pages.shops.list.title")}
          subtitle={t("pages.shops.list.subtitle")}
          actions={
            <Button
              onClick={() => navigate("create")}
              size="sm"
              variant="success"
              className="shrink-0 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" /> {t("pages.shops.list.createShop")}
            </Button>
          }
        />

        <ShopListStatCards
          stats={stats}
          activeFilter={segmentFilter}
          loading={refreshing && shops.length === 0}
          numberLocale={numberLocale}
          onFilterChange={setSegmentFilter}
        />

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={listSearchWrap}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.shops.list.searchPlaceholder")}
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
                {t("pages.shops.list.clearFilters")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("pages.shops.list.refresh")}
            </Button>
          </div>
        </div>

        {refreshing && shops.length > 0 ? (
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
        ) : filteredShops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Store className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{emptyHint}</p>
            {hasActiveFilters && (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                {t("pages.shops.list.clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {featuredShop && (
              <ShopCard
                shop={featuredShop}
                isHero
                onSelect={handleShopSelect}
                {...resolveShopLabels(featuredShop)}
              />
            )}
            {gridShops.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {gridShops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    onSelect={handleShopSelect}
                    {...resolveShopLabels(shop)}
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

export default ShopPage;
