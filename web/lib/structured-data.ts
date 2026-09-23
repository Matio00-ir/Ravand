import { SITE_URL } from "@/lib/site";

/**
 * Organization entity — kept consistent across every page that emits it.
 * `sameAs` is intentionally empty until real official profiles exist
 * (see brand rule: no fabricated partnerships/profiles). No `logo` field
 * either: schema.org expects that to resolve to a real image file, and
 * `public/` has no logo.png — an unresolved `logo` is a structured-data
 * error, not a harmless placeholder. Add it back once the asset exists.
 */
export function organizationJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "RAVAND",
    alternateName: "روند",
    url: SITE_URL,
    description:
      locale === "fa"
        ? "روند یک پلتفرم مدیریت کسب‌وکار است: ماژول‌های مالی، مشتریان، فروش و موجودی که متناسب با هر کسب‌وکار پیکربندی می‌شوند."
        : "RAVAND is a business management platform: finance, customers, sales, and inventory modules configured around each business.",
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
