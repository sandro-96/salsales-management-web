import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStorefrontShop } from "@/layouts/storefront/useStorefrontShop.js";
import { useStorefrontCart } from "@/hooks/useStorefrontCart.js";
import { formatCurrency } from "./storefrontUtils.js";

export default function StorefrontCartPage() {
  const { slug } = useParams();
  const { shop } = useStorefrontShop();
  const { t, i18n } = useTranslation();
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { items, totalAmount, updateQuantity, removeItem, clearCart } =
    useStorefrontCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">
          {t("pages.storefront.cart.emptyTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("pages.storefront.cart.emptyDesc")}
        </p>
        <Button asChild>
          <Link to={`/s/${slug}`}>
            {t("pages.storefront.cart.continueShopping")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/s/${slug}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />{" "}
            {t("pages.storefront.cart.continueBuy")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-1" />{" "}
          {t("pages.storefront.cart.clearCart")}
        </Button>
      </div>

      <h1 className="text-xl font-bold">{t("pages.storefront.cart.title")}</h1>

      <ul className="space-y-3">
        {items.map((line) => (
          <li
            key={`${line.productId}:${line.variantId || ""}`}
            className="bg-background border rounded-lg p-3 flex gap-3"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-md overflow-hidden shrink-0 flex items-center justify-center">
              {line.image ? (
                <img
                  src={line.image}
                  alt={line.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">
                {line.productName}
              </p>
              {line.variantName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pages.storefront.cart.variant")}: {line.variantName}
                </p>
              )}
              <p className="text-sm text-primary font-semibold mt-1">
                {formatCurrency(line.price, shop.currency, moneyLocale)}
              </p>
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="inline-flex items-center border rounded-md overflow-hidden text-sm">
                  <button
                    type="button"
                    className="px-2.5 py-1 hover:bg-muted"
                    onClick={() =>
                      updateQuantity(
                        line.productId,
                        line.variantId,
                        line.quantity - 1,
                      )
                    }
                  >
                    −
                  </button>
                  <span className="px-3 min-w-[2rem] text-center">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-2.5 py-1 hover:bg-muted"
                    onClick={() =>
                      updateQuantity(
                        line.productId,
                        line.variantId,
                        line.quantity + 1,
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(line.productId, line.variantId)}
                  aria-label={t("pages.storefront.cart.removeAria")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-background border rounded-lg p-4 space-y-3 sticky bottom-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("pages.storefront.cart.subtotal")}
          </span>
          <span className="font-semibold">
            {formatCurrency(totalAmount, shop.currency, moneyLocale)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("pages.storefront.cart.shipNote")}
        </p>
        <Button asChild className="w-full" size="lg">
          <Link to={`/s/${slug}/checkout`}>
            {t("pages.storefront.cart.checkoutCod")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
