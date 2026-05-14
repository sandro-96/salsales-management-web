import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "@/api/storefrontApi.js";
import { useStorefrontShop } from "@/layouts/storefront/useStorefrontShop.js";
import { formatCurrency, pickProductImage } from "./storefrontUtils.js";

const PAGE_SIZE = 24;

function useMoneyLocale() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
}

export default function StorefrontHomePage() {
  const { slug } = useParams();
  const { shop } = useStorefrontShop();
  const { t } = useTranslation();
  const moneyLocale = useMoneyLocale();
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const data = await getStorefrontProducts(slug, {
          q: opts.q ?? keyword,
          category: opts.category ?? activeCategory,
          page: 0,
          size: PAGE_SIZE,
        });
        setProducts(Array.isArray(data?.content) ? data.content : []);
        setError(null);
      } catch (err) {
        setError(err?.message || t("pages.storefront.home.loadError"));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [slug, keyword, activeCategory, t],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cats = await getStorefrontCategories(slug);
        if (alive) setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts({ q: keyword });
  };

  const subtitle = useMemo(
    () => shop.address || t("pages.storefront.home.subtitleDefault"),
    [shop, t],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border rounded-xl p-5 sm:p-7">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{shop.name}</h1>
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
        <form onSubmit={onSearchSubmit} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("pages.storefront.home.searchPlaceholder")}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="default">
            {t("pages.storefront.home.search")}
          </Button>
        </form>
      </section>

      {categories.length > 0 && (
        <section className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory("")}
          >
            {t("common.all")}
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c}
              variant={activeCategory === c ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </section>
      )}

      <section>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />{" "}
            {t("pages.storefront.home.loading")}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-sm text-destructive">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {t("pages.storefront.home.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                slug={slug}
                product={p}
                currency={shop.currency}
                moneyLocale={moneyLocale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ slug, product, currency, moneyLocale }) {
  const img = pickProductImage(product);
  return (
    <Link
      to={`/s/${slug}/products/${product.id}`}
      className="group bg-background border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col gap-1">
        <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </p>
        <p className="text-primary font-semibold text-sm sm:text-base mt-auto">
          {formatCurrency(product.price, currency, moneyLocale)}
        </p>
      </div>
    </Link>
  );
}
