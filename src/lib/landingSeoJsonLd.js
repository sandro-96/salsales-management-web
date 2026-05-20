const FAQ_IDS = ["free", "storefront", "qr", "posOffline", "industries", "upgrade"];

/**
 * @param {(key: string, opts?: object) => string} t
 * @param {{ brand: string; siteUrl: string }} ctx
 */
export function buildLandingJsonLd(t, { brand, siteUrl }) {
  const blocks = [];

  if (siteUrl) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand,
      url: `${siteUrl}/landing`,
    });
    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brand,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "99000",
        priceCurrency: "VND",
        description: t("pages.landing.seo.offerDescription"),
      },
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
