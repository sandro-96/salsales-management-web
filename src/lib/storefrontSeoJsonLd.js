/**
 * JSON-LD builders cho storefront công khai (/s/:slug).
 * Tách riêng để dễ unit-test và tái sử dụng (Store, ItemList, Product, BreadcrumbList).
 */

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function buildAddress(shop) {
  if (!shop) return undefined;
  const street = shop.address || shop.addressLine || undefined;
  if (!street && !shop.city && !shop.country) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: street || undefined,
    addressLocality: shop.city || shop.district || undefined,
    addressRegion: shop.region || shop.province || undefined,
    addressCountry: shop.country || "VN",
  };
}

function buildContactPoints(shop) {
  const phones = safeArray(shop?.phones).length
    ? safeArray(shop.phones)
    : safeArray([shop?.phone]);
  if (!phones.length) return undefined;
  return phones.map((tel) => ({
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: tel,
    availableLanguage: ["Vietnamese", "English"],
  }));
}

function buildSameAs(shop) {
  return safeArray([
    shop?.facebookUrl,
    shop?.zaloUrl,
    shop?.tiktokUrl,
    shop?.shopeeUrl,
    shop?.instagramUrl,
    shop?.websiteUrl,
  ]);
}

/**
 * Store schema cho landing storefront. Dùng `Store` (thực thể vật lý + online)
 * — phù hợp cho hầu hết shop bán lẻ / F&B của bạn. Nếu shop chỉ online thì
 * Google vẫn hiểu đúng vì Store kế thừa LocalBusiness/Organization.
 */
export function buildStoreJsonLd(shop, { siteUrl, slug, brand }) {
  if (!shop) return null;
  const url = siteUrl ? `${siteUrl}/s/${slug}` : undefined;
  const sameAs = buildSameAs(shop);
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": url ? `${url}#store` : undefined,
    name: shop.name,
    url,
    image: shop.logoUrl || shop.coverUrl || undefined,
    logo: shop.logoUrl || undefined,
    description: shop.description || shop.shortDescription || undefined,
    telephone: shop.phone || (safeArray(shop.phones)[0] ?? undefined),
    email: shop.email || undefined,
    address: buildAddress(shop),
    contactPoint: buildContactPoints(shop),
    sameAs: sameAs.length ? sameAs : undefined,
    currenciesAccepted: shop.currency || "VND",
    paymentAccepted: "Cash on delivery, Bank transfer",
    isPartOf: siteUrl
      ? {
          "@type": "Organization",
          name: brand,
          url: siteUrl,
        }
      : undefined,
  };
}

/**
 * ItemList chứa tối đa N sản phẩm hiện trên trang home — giúp Google hiểu cấu
 * trúc danh sách và tăng cơ hội hiển thị rich result kiểu carousel.
 */
export function buildItemListJsonLd(products, { siteUrl, slug, limit = 24 }) {
  const items = safeArray(products).slice(0, limit);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: siteUrl
        ? `${siteUrl}/s/${slug}/products/${p.id}`
        : undefined,
      name: p.name,
    })),
  };
}

/**
 * Product schema — chuẩn rich snippet với offers (price/availability/itemCondition).
 * Variants được map thành AggregateOffer khi có ≥2 biến thể có giá khác nhau.
 */
export function buildProductJsonLd(product, shop, { siteUrl, slug }) {
  if (!product) return null;
  const productUrl = siteUrl
    ? `${siteUrl}/s/${slug}/products/${product.id}`
    : undefined;
  const images = safeArray(product.images).length
    ? safeArray(product.images)
    : safeArray(
        product.variants?.flatMap((v) => safeArray(v.images)) ?? [],
      );

  const currency = shop?.currency || "VND";
  const variants = safeArray(product.variants);
  const variantPrices = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  let offers;
  if (variantPrices.length >= 2) {
    const low = Math.min(...variantPrices);
    const high = Math.max(...variantPrices);
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: low,
      highPrice: high,
      offerCount: variantPrices.length,
      availability: "https://schema.org/InStock",
      url: productUrl,
      seller: shop?.name
        ? { "@type": "Organization", name: shop.name }
        : undefined,
    };
  } else {
    const price = Number(product.price ?? variantPrices[0]) || 0;
    if (price > 0) {
      offers = {
        "@type": "Offer",
        priceCurrency: currency,
        price,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: productUrl,
        seller: shop?.name
          ? { "@type": "Organization", name: shop.name }
          : undefined,
      };
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productUrl ? `${productUrl}#product` : undefined,
    name: product.name,
    description: product.description || undefined,
    sku: product.sku || product.id?.toString() || undefined,
    image: images.length ? images : undefined,
    category: product.category || undefined,
    brand: shop?.name
      ? { "@type": "Brand", name: shop.name }
      : undefined,
    offers,
  };
}

/**
 * BreadcrumbList Home > Shop > [Product]. Hữu ích khi có site_url để link
 * tuyệt đối; nếu không có thì trả về null vì breadcrumb không có URL ít giá trị.
 */
export function buildStorefrontBreadcrumbJsonLd(
  shop,
  { siteUrl, slug, productName },
) {
  if (!siteUrl || !slug) return null;
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: shop?.name || slug,
      item: `${siteUrl}/s/${slug}`,
    },
  ];
  if (productName) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: productName,
    });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}
