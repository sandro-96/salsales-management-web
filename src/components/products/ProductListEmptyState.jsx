import { PackagePlus, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function ProductListEmptyState({
  hasFilters,
  canCreate,
  onAdd,
  onClearFilters,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Package className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="font-medium text-foreground">
          {hasFilters
            ? t("pages.products.list.emptyFiltered")
            : t("pages.products.list.empty")}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? t("pages.products.list.emptyFilteredHint")
            : t("pages.products.list.emptyHint")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {hasFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            {t("pages.products.list.clearFilters")}
          </Button>
        ) : null}
        {canCreate ? (
          <Button type="button" variant="default" size="sm" onClick={onAdd}>
            <PackagePlus className="h-4 w-4 mr-1.5" />
            {t("pages.products.list.addProduct")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
