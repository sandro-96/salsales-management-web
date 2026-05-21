import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RouteOutletSuspense from "@/components/routing/RouteOutletSuspense.jsx";
import { getStorefrontShop } from "@/api/storefrontApi.js";
import StorefrontCartProvider from "@/contexts/StorefrontCartProvider.jsx";
import StorefrontHeader from "./StorefrontHeader.jsx";
import StorefrontFooter from "./StorefrontFooter.jsx";
import StorefrontUnavailable from "./StorefrontUnavailable.jsx";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  StorefrontShopContext,
  STOREFRONT_STATUS,
} from "./storefrontShopContext.js";

/**
 * Layout dành riêng cho storefront công khai.
 * Khác với BaseWebLayout (admin/POS): KHÔNG sidebar, KHÔNG auth, KHÔNG sub-domain.
 * Toàn bộ trang con đều có thể đọc shop hiện tại qua `useStorefrontShop()`.
 */
export default function StorefrontLayout() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [status, setStatus] = useState(STOREFRONT_STATUS.LOADING);
  const [shop, setShop] = useState(null);

  const loadShop = useCallback(async () => {
    if (!slug) {
      setStatus(STOREFRONT_STATUS.NOT_FOUND);
      return;
    }
    setStatus(STOREFRONT_STATUS.LOADING);
    try {
      const data = await getStorefrontShop(slug);
      setShop(data);
      setStatus(STOREFRONT_STATUS.READY);
    } catch (err) {
      const code = err?.payload?.code || err?.response?.data?.code;
      if (code === "4180") {
        // ONLINE_SALES_DISABLED
        setStatus(STOREFRONT_STATUS.DISABLED);
      } else {
        setStatus(STOREFRONT_STATUS.NOT_FOUND);
      }
    }
  }, [slug]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  if (status === STOREFRONT_STATUS.LOADING) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("pages.storefront.layout.loading")}
        </p>
      </section>
    );
  }

  if (status !== STOREFRONT_STATUS.READY || !shop) {
    return <StorefrontUnavailable status={status} slug={slug} />;
  }

  return (
    <StorefrontShopContext.Provider value={{ shop, status, reload: loadShop }}>
      <StorefrontCartProvider slug={slug}>
        <div className="min-h-screen flex flex-col bg-muted/30">
          <StorefrontHeader />
          <main className="flex-1">
            <RouteOutletSuspense />
          </main>
          <StorefrontFooter />
        </div>
      </StorefrontCartProvider>
    </StorefrontShopContext.Provider>
  );
}
