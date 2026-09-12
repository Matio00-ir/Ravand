# RAVAND — Marketing Website

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + next-intl.
Persian-first, bilingual (fa/en), SSR/SSG, SEO- and GEO-ready.

See **[`/docs/REPORT.md`](../docs/REPORT.md)** at the repo root for the full
design system, architecture decisions, and content/SEO roadmap.

## Getting started

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL
npm run dev                  # http://localhost:3000
```

- `npm run build` — production build (also runs the TypeScript check)
- `npm run lint` — ESLint
- `npm run start` — serve the production build

## Project structure

```
app/
  [locale]/            fa (default, no prefix) and en (/en) routes
    layout.tsx          root layout: <html lang/dir>, fonts, Navbar/Footer, Organization+WebSite JSON-LD
    page.tsx             homepage
    products/            products hub
    solutions/            solutions hub
    industries/            industries hub
    company/about/          about
    company/contact/         contact (form UI, not yet wired to a backend)
    demo/                     demo request (form UI, not yet wired to a backend)
  sitemap.ts            locale-aware sitemap.xml
  robots.ts             robots.txt
  not-found.tsx          global 404 (no locale)
i18n/
  routing.ts            locales, default locale, localized pathnames
  navigation.ts          typed Link/useRouter/usePathname
  request.ts              next-intl request config
proxy.ts                 locale routing proxy (Next 16's renamed "middleware")
messages/{fa,en}.json     all UI copy
components/
  system/                 the visual system: Shell, Rails, Zone, Marker/Lockup,
                           PlaneStack, ModuleIcon, Reveal
  product/                 the RAVAND product surface (Dashboard, Chart) — the
                           reference implementation of the design system
  ui/                       Button, LinkButton, Logo
  layout/                    Navbar, Footer, LanguageSwitcher
  sections/                   page zones (Hero, Fragment, Platform, Configure,
                               IndustryIndex, Process, Closing, …)
lib/
  fonts.ts                Manrope + Vazirmatn (next/font/google)
  structured-data.ts        JSON-LD builders (Organization, WebSite, SoftwareApplication, BreadcrumbList)
```

## Notes

- This is Next.js **16**, which renamed `middleware.ts` → `proxy.ts` and made
  `params` a Promise everywhere. If you're used to older Next.js, skim
  `node_modules/next/dist/docs/` before making routing/layout changes.
- The contact and demo forms are UI-complete but intentionally **not**
  wired to a backend yet (no fake "submitted!" claims to a real system) —
  see the REPORT for the recommended integration.
