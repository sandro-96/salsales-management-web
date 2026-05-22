const FAQ_IDS = [
  "hardware",
  "printer",
  "free",
  "storefront",
  "qr",
  "posOffline",
  "industries",
  "upgrade",
];

/**
 * @param {(key: string, opts?: object) => string} t
 * @param {{ brand: string; siteUrl: string }} ctx
 */
export function buildLandingJsonLd(t, { brand, siteUrl }) {
  const blocks = [];
  const landingUrl = siteUrl ? `${siteUrl}/landing` : undefined;

  if (siteUrl) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: brand,
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("pages.landing.metaTitle", { defaultValue: "Landing" }),
          item: landingUrl,
        },
      ],
    });

    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brand,
      url: landingUrl,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "PointOfSaleSoftware",
      operatingSystem: "Web, iOS, Android, Windows, macOS",
      browserRequirements: "Requires JavaScript. Tested on modern Chrome, Safari, Edge, Firefox.",
      description: t("pages.landing.seo.description", { defaultValue: "" }),
      inLanguage: "vi",
      image: t("pages.landing.seo.ogImage", { defaultValue: undefined }),
      offers: {
        "@type": "Offer",
        price: "99000",
        priceCurrency: "VND",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "99000",
          priceCurrency: "VND",
          unitText: "MONTH",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
        },
        availability: "https://schema.org/InStock",
        description: t("pages.landing.seo.offerDescription", { defaultValue: "" }),
      },
      aggregateRating: undefined,
    });
  }

  blocks.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_IDS.map((id) => ({
      "@type": "Question",
      name: t(`pages.landing.faq.items.${id}.q`, { brand }),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`pages.landing.faq.items.${id}.a`, { brand }),
      },
    })),
  });

  return blocks.length === 1 ? blocks[0] : blocks;
}
