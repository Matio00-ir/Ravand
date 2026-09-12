import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravand.example";

// Public, indexable routes only (see /docs/REPORT.md §Indexing).
const routes = [
  "/",
  "/products",
  "/solutions",
  "/industries",
  "/company/about",
  "/company/contact",
  "/demo",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((href) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `${SITE_URL}${getPathname({ href, locale })}`,
      ])
    );

    return {
      url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
      lastModified: new Date(),
      changeFrequency: href === "/" ? "weekly" : "monthly",
      priority: href === "/" ? 1 : 0.7,
      alternates: { languages },
    };
  });
}
