import { defineRouting } from "next-intl/routing";

/**
 * RAVAND is Persian-first. Persian has no prefix (default locale, served at "/"),
 * English is served under "/en". This keeps the canonical Persian URLs clean
 * (better for the primary market's SEO) while still giving English a fully
 * crawlable, distinct URL namespace for international SEO.
 */
export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  // RAVAND is Persian-first: "/" always serves fa regardless of the
  // visitor's browser language. English is an explicit choice via the
  // language switcher or a direct "/en" link, never an auto-redirect.
  localeDetection: false,
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      en: "/en",
    },
  },
  pathnames: {
    "/": "/",
    // Built now — real hub pages, each with unique, substantive content.
    "/products": { fa: "/محصولات", en: "/products" },
    "/solutions": { fa: "/راهکارها", en: "/solutions" },
    "/industries": { fa: "/صنایع", en: "/industries" },
    "/company/about": { fa: "/درباره-ما", en: "/company/about" },
    "/company/contact": { fa: "/تماس-با-ما", en: "/company/contact" },
    "/demo": { fa: "/درخواست-دمو", en: "/demo" },
    // Reserved for Phase 2/3 content roadmap (see docs/REPORT.md) —
    // deep-linking individual product/industry pages once real content exists.
    "/products/erp": { fa: "/محصولات/erp", en: "/products/erp" },
    "/products/crm": { fa: "/محصولات/crm", en: "/products/crm" },
    "/products/finance": { fa: "/محصولات/مالی", en: "/products/finance" },
    "/products/inventory": { fa: "/محصولات/موجودی", en: "/products/inventory" },
    "/products/sales": { fa: "/محصولات/فروش", en: "/products/sales" },
    "/products/workflow": { fa: "/محصولات/workflow", en: "/products/workflow" },
    "/industries/manufacturing": { fa: "/صنایع/تولید-و-کارخانه", en: "/industries/manufacturing" },
    "/industries/trading": { fa: "/صنایع/بازرگانی", en: "/industries/trading" },
    "/industries/retail": { fa: "/صنایع/هایپرمارکت-و-خرده-فروشی", en: "/industries/retail" },
    "/industries/services": { fa: "/صنایع/خدمات", en: "/industries/services" },
    "/industries/fitness": { fa: "/صنایع/باشگاه", en: "/industries/fitness" },
    "/industries/healthcare": { fa: "/صنایع/کلینیک", en: "/industries/healthcare" },
    "/resources": { fa: "/منابع", en: "/resources" },
  },
});

export type Pathname = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];
