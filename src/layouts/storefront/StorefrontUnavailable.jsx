import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STOREFRONT_STATUS } from "./storefrontShopContext.js";

export default function StorefrontUnavailable({ status, slug }) {
  const { t } = useTranslation();

  const isDisabled = status === STOREFRONT_STATUS.DISABLED;
  const title = isDisabled
    ? t("pages.storefront.unavailable.disabledTitle")
    : t("pages.storefront.unavailable.notFoundTitle");
  const desc = isDisabled
    ? t("pages.storefront.unavailable.disabledDesc")
    : t("pages.storefront.unavailable.notFoundDesc");

  return (
    <section className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md w-full bg-background border rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Store className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{desc}</p>
        {slug && (
          <p className="text-xs font-mono text-muted-foreground/80 bg-muted rounded px-2 py-1 inline-block">
            /s/{slug}
          </p>
        )}
      </div>
    </section>
  );
}
