import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import type { Pathname } from "@/i18n/routing";

/**
 * Canonical + hreflang for one internal route, in both locales.
 *
 * Next.js metadata does NOT deep-merge `alternates` between a layout and
 * a page: the root layout (app/[locale]/layout.tsx) sets `canonical` +
 * `languages` (hreflang), but any page that returns its own `alternates`
 * with only `canonical` silently drops the inherited `languages` entirely
 * — every hub page did exactly that. This returns both together so a
 * page's `generateMetadata` can never reintroduce that gap.
 */
export function localizedAlternates(href: Pathname, locale: string) {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ href, locale: l })])
  );
  return {
    canonical: getPathname({ href, locale }),
    languages: {
      ...languages,
      "x-default": getPathname({ href, locale: routing.defaultLocale }),
    },
  };
}
