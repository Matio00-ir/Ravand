const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravand.example";

/**
 * Organization entity — kept consistent across every page that emits it.
 * `sameAs` is intentionally empty until real official profiles exist
 * (see brand rule: no fabricated partnerships/profiles).
 */
export function organizationJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "RAVAND",
    alternateName: "روند",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      locale === "fa"
        ? "روند سیستم‌های مدیریتی، مالی، مشتریان، فروش و موجودی را برای کسب‌وکارها طراحی و توسعه می‌دهد."
        : "RAVAND designs and builds management systems for finance, customers, sales, and inventory for businesses.",
    sameAs: [],
  };
}

export function websiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "RAVAND",
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function softwareApplicationJsonLd({
  locale,
  name,
  description,
  category,
}: {
  locale: string;
  name: string;
  description: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: category,
    operatingSystem: "Web",
    inLanguage: locale,
    offers: {
      "@type": "Offer",
      category: "Demo",
      description:
        locale === "fa" ? "۱۴ روز دسترسی رایگان به محیط دمو" : "14 days of free access to the demo environment",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
