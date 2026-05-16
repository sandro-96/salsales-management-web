import { Percent, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { posNumberLocale } from "../../utils/posHelpers";
import {
  calcDiscountedPrice,
  formatDiscount,
  getWinningPromo,
} from "./posPromotionUtils";
import { hasBranchVariants, isProductOutOfStock } from "./posProductUtils";

export function PosProductCard({
  product,
  inCartQty,
  promoMap,
  onSelect,
}) {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);

  const promo = getWinningPromo(promoMap, product.productId, product.price);
  const discountedPrice = calcDiscountedPrice(product.price, promo);
  const hasPromo = promo && discountedPrice < product.price;
  const outOfStock = isProductOutOfStock(product);

  return (
    <Card
      className={cn(
        "relative overflow-hidden h-full flex flex-col gap-0 p-0 py-0 shadow-sm transition-all",
        outOfStock
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:ring-2 hover:ring-primary/50 active:scale-[0.98]",
      )}
      onClick={() => {
        if (!outOfStock) onSelect(product);
      }}
    >
      <div className="aspect-square w-full shrink-0 bg-muted/50 relative overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover",
              outOfStock && "grayscale",
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold uppercase tracking-wide"
            >
              {t("pages.pos.cart.outOfStock")}
            </Badge>
          </div>
        )}
        {hasPromo && !outOfStock && (
          <Badge className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 gap-0.5">
            <Percent className="h-2.5 w-2.5" />
            {formatDiscount(promo, numberLocale)}
          </Badge>
        )}
        {hasBranchVariants(product) && !outOfStock && (
          <Badge
            variant="outline"
            className="absolute bottom-1.5 left-1.5 text-[9px] px-1 py-0 h-5 bg-background/90"
          >
            {t("pages.pos.cart.hasVariants")}
          </Badge>
        )}
        {inCartQty > 0 && (
          <Badge className="absolute top-1.5 right-1.5 h-6 min-w-6 justify-center text-xs">
            {inCartQty}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2 pt-2">
        <p className="line-clamp-2 min-h-[2.625rem] text-xs font-medium leading-snug text-foreground">
          {product.name}
        </p>
        {hasPromo ? (
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-emerald-600 tabular-nums">
              {discountedPrice.toLocaleString(numberLocale)} ₫
            </span>
            <span className="text-[10px] line-through text-muted-foreground tabular-nums">
              {product.price.toLocaleString(numberLocale)}₫
            </span>
          </div>
        ) : (
          <p className="mt-auto text-sm font-bold text-primary tabular-nums">
            {product.price?.toLocaleString(numberLocale)} ₫
          </p>
        )}
        {product.sellByWeight && product.trackInventory !== false && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {t("pages.pos.cart.stockRemaining", {
              amount: (product.stockInBaseUnits ?? 0).toLocaleString(
                numberLocale,
              ),
              unit: (() => {
                const u = String(product.unit || "")
                  .trim()
                  .toLowerCase();
                if (u === "kg" || u === "g") return t("pages.pos.cart.unitG");
                if (u === "l" || u === "ml") return t("pages.pos.cart.unitMl");
                return u || "";
              })(),
            })}
          </p>
        )}
      </div>
    </Card>
  );
}
