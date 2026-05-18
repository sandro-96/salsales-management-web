import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStorefrontProductDetail } from "@/api/storefrontApi.js";
import { useStorefrontShop } from "@/layouts/storefront/useStorefrontShop.js";
import { useStorefrontCart } from "@/hooks/useStorefrontCart.js";
import { ProductImageGallery } from "@/components/products/ProductImageGallery.jsx";
import { StorefrontProductDescription } from "./StorefrontProductDescription.jsx";
import {
  collectGalleryImages,
  formatCurrency,
  pickVariantImage,
} from "./storefrontUtils.js";

export default function StorefrontProductDetailPage() {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { shop } = useStorefrontShop();
  const { addItem } = useStorefrontCart();
  const { t, i18n } = useTranslation();
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStorefrontProductDetail(slug, productId)
      .then((data) => {
        if (!alive) return;
        setProduct(data);
        if (data?.variants?.length > 0) {
          setSelectedVariantId(data.variants[0].variantId);
        }
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || t("pages.storefront.product.notFound"));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, productId, t]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.variantId === selectedVariantId) || null;
  }, [product, selectedVariantId]);

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

  const galleryImages = useMemo(
    () => (product ? collectGalleryImages(product, selectedVariant) : []),
    [product, selectedVariant],
  );

  useEffect(() => {
    setGalleryIndex(0);
  }, [selectedVariantId, galleryImages.length]);

  const displayImage =
    galleryImages[galleryIndex] ??
    pickVariantImage(selectedVariant, product);

  const handleAddToCart = (goToCart = false) => {
    if (!product) return;
    if (product.variants?.length > 0 && !selectedVariantId) {
      toast.error(t("pages.storefront.product.toastSelectVariant"));
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariantId,
      variantName: selectedVariant?.name,
      price: displayPrice,
      image: displayImage,
      quantity: Math.max(1, Number(quantity) || 1),
    });
    toast.success(t("pages.storefront.product.toastAdded"));
    if (goToCart) {
      navigate(`/s/${slug}/cart`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />{" "}
        {t("pages.storefront.product.loading")}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-destructive mb-4">
          {error || t("pages.storefront.product.notFound")}
        </p>
        <Button asChild variant="outline">
          <Link to={`/s/${slug}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />{" "}
            {t("pages.storefront.product.back")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to={`/s/${slug}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />{" "}
          {t("pages.storefront.product.back")}
        </Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <ProductImageGallery
          images={galleryImages}
          activeIndex={galleryIndex}
          onActiveIndexChange={setGalleryIndex}
          alt={product.name}
          className="rounded-lg border bg-background p-2"
          mainClassName="aspect-square w-full"
        />

        <div className="space-y-4">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            {product.name}
          </h1>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(displayPrice, shop.currency, moneyLocale)}
          </p>

          {product.variants?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                {t("pages.storefront.product.variantTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.variantId}
                    type="button"
                    onClick={() => setSelectedVariantId(v.variantId)}
                    className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                      selectedVariantId === v.variantId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">
              {t("pages.storefront.product.qtyTitle")}
            </p>
            <div className="inline-flex items-center border rounded-md overflow-hidden">
              <button
                type="button"
                className="px-3 py-1.5 hover:bg-muted"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-14 text-center bg-background outline-none"
              />
              <button
                type="button"
                className="px-3 py-1.5 hover:bg-muted"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => handleAddToCart(false)}
            >
              {t("pages.storefront.product.addToCart")}
            </Button>
            <Button
              className="sm:flex-1"
              onClick={() => handleAddToCart(true)}
            >
              {t("pages.storefront.product.buyNow")}
            </Button>
          </div>
        </div>
      </div>

      <StorefrontProductDescription content={product.description} />
    </div>
  );
}
