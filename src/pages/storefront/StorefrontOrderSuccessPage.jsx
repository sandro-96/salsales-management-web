import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStorefrontShop } from "@/layouts/storefront/useStorefrontShop.js";
import { formatCurrency } from "./storefrontUtils.js";

export default function StorefrontOrderSuccessPage() {
  const { slug, orderCode } = useParams();
  const { shop } = useStorefrontShop();
  const { state } = useLocation();
  const order = state?.order || null;
  const { t, i18n } = useTranslation();
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-background border rounded-xl p-6 sm:p-8 text-center shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-300 mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold mb-1">
          {t("pages.storefront.success.title")}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {t("pages.storefront.success.thanks", { shop: shop.name })}
        </p>

        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 mb-5">
          <div>
            {t("pages.storefront.success.orderCode")}{" "}
            <span className="font-mono font-semibold">
              {order?.orderCode || orderCode}
            </span>
          </div>
          {order?.totalAmount != null && (
            <div>
              {t("pages.storefront.success.total")}{" "}
              <span className="font-semibold text-primary">
                {formatCurrency(
                  order.totalAmount,
                  shop.currency,
                  moneyLocale,
                )}
              </span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {t("pages.storefront.success.paymentCod")}
          </div>
        </div>

        <Button asChild className="w-full">
          <Link to={`/s/${slug}`}>
            <ShoppingBag className="h-4 w-4 mr-1" />{" "}
            {t("pages.storefront.success.continue")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
