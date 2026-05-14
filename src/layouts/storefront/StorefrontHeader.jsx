import { Link } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStorefrontShop } from "./useStorefrontShop.js";
import { useStorefrontCart } from "@/hooks/useStorefrontCart.js";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/common/LanguageSwitcher.jsx";

export default function StorefrontHeader() {
  const { shop } = useStorefrontShop();
  const { totalQuantity } = useStorefrontCart();
  const { t } = useTranslation();
  const base = `/s/${shop.slug}`;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to={base} className="flex items-center gap-2 min-w-0">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="h-9 w-9 rounded-md object-cover border"
            />
          ) : (
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{shop.name}</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {t("storefront.header.subtitle")}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Link
            to={`${base}/cart`}
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted transition-colors"
            aria-label={t("storefront.header.cart")}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalQuantity > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                {totalQuantity}
              </Badge>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
