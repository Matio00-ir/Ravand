# RAVAND Website — Design & Engineering Report

**Version 2.0 — complete visual redesign.**
Homepage + 6 hub pages, bilingual (fa/en), production build and lint clean.

v1 was rejected as generic: a stack of marketing sections, card grids, a
templated hero. This version replaces the visual language entirely. The
technical infrastructure (Next.js 16 App Router, next-intl routing, SSG,
SEO/structured data) was kept and re-skinned; **every component that
produced a pixel was rewritten or deleted.**

---

## 1. What changed, and why

| v1 (rejected) | v2 |
|---|---|
| Sections stacked as independent marketing blocks | **Zones** on a shared structural grid, with rails running continuously through all of them |
| Hero = headline + two buttons + floating dashboard card | Hero = brand statement on the grid + the real product cropped by the viewport edge + the module index rail |
| Feature cards (6-tile module grid, 4-tile tier grid, 6-tile industry grid, 4-step cards, 5-step cards) | **Specification indexes**: hairline-separated registers, a selectable industry index with one detail panel, a numbered process register with stated outputs |
| "Customization" explained with a 5-node diagram | **A working configurator** — choose a business model, the actual product surface reconfigures |
| Decorative dashboard mockup with fake bars | A real RAVAND product surface: sidebar, KPI register, comparison chart, document table, status system — localised, RTL-native |
| Light navbar over dark hero | A permanent black masthead as fixed brand chrome |
| Section headings all identical (eyebrow/title/description, centered or left) | Varied composition per zone: editorial split, asymmetric header, index+panel, full-bleed product |

**Sections removed outright** rather than restyled: Capability strip, Why
RAVAND (folded into three statements), DemoCta band, generic Modules grid,
Customization step diagram, Industries card grid, standalone ProductShowcase.

---

## 2. The visual system

Four devices do the work. They are defined once and reused everywhere,
which is what makes the site legible as a proprietary system rather than a
theme.

### 2.1 Rails — the continuous structural grid
`components/system/Rails.tsx`

Hairlines at fixed fractions of the shell (0 / 25 / 50 / 75 / 100%),
redrawn in every zone at the same positions, in the tone that zone needs.
Because every zone shares one measure (`--shell: 1360px`, `.shell`), they
line up across zone boundaries and read as unbroken verticals running from
the masthead to the footer. Content aligns to them: the 12-column grids in
each zone resolve onto the same lines. The two inner rails drop below
`md`, where the layout is single-column and they'd be noise.

This is the mechanism for "one composition, not ten sections" — no section
dividers, no card outlines doing that job.

### 2.2 Marker — the index
`components/system/Marker.tsx`

Each homepage zone opens with `۰۱ ——— وضعیت امروز`: a localised numeral, a
short rule, a label. The page reads as a numbered technical document. The
numbering is the *homepage's* narrative, so hub pages pass `numbered={false}`
and get the label alone.

### 2.3 Lockup — the identity's divider, reused
`components/system/Marker.tsx` (`Lockup`)

The logo is `RAVAND | روند`. That construction — two labels, one vertical
rule — is reused as an interface element: the hero's brand line, the hub
page eyebrows, and the language switcher (`فا | EN`). A brand callback
that carries information instead of decoration.

### 2.4 Planes — the abstract graphic
`components/system/PlaneStack.tsx`

The identity sheet specifies "abstract system visualisations instead of
literal illustrations — geometric, minimal, focused on flow, structure and
connection." That's a stack of offset parallelograms. On enter, the planes
move from scattered to registered: fragmented processes becoming one
structure. It states the argument geometrically — no arrows, no flowchart,
no nodes, no stock illustration. It mirrors in RTL so the flow always
reads forward.

---

## 3. The product as a brand asset
`components/product/Dashboard.tsx`, `components/product/Chart.tsx`

The strongest asset RAVAND has is that the software exists, so the product
surface was designed as part of the identity, not mocked up:

- **Hairline separation, not nested cards.** KPI figures sit in a divided
  register; panels are separated by rules. No rounded box inside a rounded
  box.
- **Graphite hierarchy.** `#0B0D10` shell, `#12161C` surface, `#171C23`
  panels, white at 6–9% for raised states. The accent appears once — the
  active navigation marker — and once in the chart series.
- **Restrained data-viz.** One accented area+line series, one dashed
  comparison series, hairline gridlines, no legend chrome. Semantic colour
  (success/warning/info/error) appears *only* on status dots.
- **Tabular figures** (`font-variant-numeric: tabular-nums`) so numbers
  align in columns like real financial software.
- **Density without clutter**: 14px rows, 11px labels, generous horizontal
  padding.
- **Genuinely bilingual.** Every string is localised, including Persian
  numerals (۱٬۲۴۸) and a Jalali period label (شهریور ۱۴۰۵). Layout uses
  logical properties, so the sidebar moves to the right in Persian — a
  Persian product, not a mirrored English one.
- **Reconfigurable**, because the configurator drives it with a module
  list. The same component renders the hero crop, the configurator, and
  (later) can seed the real dashboard restyle.

Sample data is clearly labelled as such ("حساب نمونه ۰۴" / "Sample account
04") — no invented customers, per the no-fake-content rule.

---

## 4. Composition per zone

The homepage never repeats a layout:

| Zone | Tone | Composition |
|---|---|---|
| Hero | deep | Asymmetric 5/7 split; product cropped by the viewport edge; closes on the full-width module index rail |
| 01 Fragment | light | Editorial spread — statement left of centre, plane stack opposite, large negative space |
| 02 Platform | raised | Specification index: 8 rows × (icon+name+code / coverage / capabilities), hairline separated |
| 03 Configure | deep | Interactive: business-model selector, module toggles, live product surface |
| 04 Industries | light | Selectable index against one detail panel (focus + typical modules) |
| 05 Process | raised | Numbered register with a stated **output** per stage, then three principles as plain statements divided by rules |
| Closing | deep | Statement + one action; the demo path as a quiet divided sequence |
| Footer | deep | Brand block + four link columns + legal bar |

**Dark/light rhythm is narrative, not alternating**: deep = brand and
product moments (hero, configurator, close, footer); light = where the
system is explained. Three tone changes on the whole page.

---

## 5. Tokens

Defined once in `app/globals.css` as CSS variables + Tailwind v4 `@theme`
tokens, so every value is both `var(--color-ink)` and a utility
(`text-ink`).

**Colour** — `#0B0D10` black, `#15191F` graphite, `#252A31` carbon,
`#69727D` steel, `#B7BEC7` silver, `#F7F8FA` off-white; accent `#71859E`
(used on: focus rings, the active product-nav marker, the chart series —
nothing else); status `#2E7D32 / #F59E08 / #EF4444 / #3B82F6`, status only.
Hairlines are their own tokens (`--hair-light`, `--hair-dark` at 8%, plus
14% "strong" variants) because they carry the structure.

**Type** — Manrope (Latin) / Vazirmatn (Persian), self-hosted via
`next/font`. Scale: `t-display` clamp(2.5–4.25rem) at -0.035em, `t-h2`
clamp(1.75–2.625rem), `t-h3`, `t-h4`, `t-lead`, `t-body` 15px/1.65,
`t-small`, and three technical classes:
- `t-label` — uppercase tracked Latin; Persian drops the case transform
  and the tracking (both damage Persian letterforms)
- `t-code` — **family-locked to Manrope**, for strings that stay Latin in
  both locales (ERP, INV-2481, R—01)
- `t-index` — *not* family-locked, because index numerals are localised
  (۰۱) and must render in Vazirmatn

**Radius** 4/6/8/10px only. **Spacing** on the 8px system. **Motion**
`--ease-flow` at 150/200/250ms, plus two 280–600ms cases: the zone reveal
and the product reconfiguring.

---

## 6. Motion

Three behaviours, all disciplined:

1. **Reveal** (`components/system/Reveal.tsx`) — IntersectionObserver,
   opacity + 14px lift, 600ms, fires once. No parallax, no scale, no
   stagger beyond a single delay.
2. **Panel-in** — when the configurator or industry panel changes, the
   surface settles: opacity 0.45→1 with a 4px lift over 280ms. The system
   reconfiguring, not an entrance effect.
3. **Plane registration** — the abstract graphic's scattered→aligned
   move, 900ms with a 60ms per-plane offset.

`prefers-reduced-motion: reduce` collapses all of it globally.

---

## 7. Bilingual / RTL

- Persian is the default locale at `/` with **no prefix**; English at
  `/en`. `localeDetection: false` — a Persian visitor is never
  auto-redirected because their browser is set to English.
- Localised Persian URL slugs (`/محصولات`, `/درباره-ما`, `/درخواست-دمو`).
- Logical properties throughout (`ps/pe/ms/me/start/end`, `border-s/e`) —
  zero per-direction CSS branching.
- `<bdi>` isolates opposite-script runs (the hero's counterpart line) so
  they render correctly without flipping their paragraph's alignment.
- English copy is an independent rewrite, not a translation.

---

## 8. Responsive

Verified at 375px and 1280px in both locales, and horizontal overflow
checked programmatically (`scrollWidth === clientWidth` at 375px).

One real trap was found and fixed in three places: a grid or flex item
containing a wide scroller **needs `min-w-0`**, otherwise the track sizes
to the scroller's max-content and silently widens the entire page. It
affected the hero product column, the industry index, and the configurator
selector. The wide product surface is pannable (`overflow-x-auto`) on
small screens rather than shrunk into illegibility.

---

## 9. SEO / GEO — unchanged and still passing

The redesign did not weaken any of it: per-page title/description,
single H1 per page with correct H2/H3 order, canonical + hreflang
(fa/en/x-default), locale-aware `sitemap.xml`, `robots.txt`, Open Graph +
Twitter, and JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`,
`BreadcrumbList`). All 19 routes are statically generated — content,
headings, and links exist in the HTML with zero client JS. `sameAs` stays
empty until real profiles exist.

Still needed before launch (unchanged from v1): set
`NEXT_PUBLIC_SITE_URL`, verify in Search Console and submit the sitemap,
run the Rich Results Test, replace the placeholder favicon and add OG
images.

---

## 10. Still not built (deliberately)

| Item | Why |
|---|---|
| **Dashboard visual redesign** (the real product) | Now genuinely unblocked: `Dashboard.tsx` *is* the target design system for it — tokens, density, nav, tables, charts, and status are all specified and running. Recommended next task. |
| Backend for the two forms | No fake success state; they show an honest "not connected yet". A form service or CRM webhook is enough for launch — no database needed. |
| Individual product/industry pages | Reserved in `i18n/routing.ts`. They need genuinely distinct content, not templated variants. |
| CMS / blog / `/resources` | No content to manage yet; MDX in-repo will cover Phase 3 volume. |
| Analytics | No provider chosen — flagging rather than guessing a vendor. |
| Vector logo master | The mark is redrawn as SVG from the identity sheet. If a vector master exists, swap `components/ui/Logo.tsx`. |

---

## 11. Decisions I made that weren't specified

1. **Permanent black masthead** on every page, rather than a transparent
   navbar that switches tone per section. It gives a fixed brand frame,
   keeps the logo on its approved dark treatment everywhere, and removes
   the light-navbar-over-dark-hero seam.
2. **Rails as the continuity device.** The brief asked for sections to
   connect visually; a shared, always-visible structural grid does that
   more convincingly than gradients or spacing alone.
3. **Zone numbering** as a technical-document device — and dropping it on
   hub pages, where a page that opens at "02" would be incoherent.
4. **The configurator's four business models** (manufacturer, trading,
   services, retail) and their module sets. The brief asked to *show*
   configurability; presets make the point in one click, and free module
   toggles let a sceptic verify it.
5. **Process stages state an output** (Process map, System architecture,
   Working environment, Custom modules, Live system) rather than a
   duration. Concrete, and doesn't invent timelines.
6. **Module icon set** drawn from scratch (8 icons, 1.5px, square caps,
   mitred joins) avoiding every banned metaphor.
7. **Square caps / mitred joins** on all icon geometry — technical rather
   than friendly, which is the 30% enterprise half of the brand.
8. **Persian numerals in Persian copy** (۰۱, ۱٬۲۴۸, ۹۶) including the
   Closing sequence via `Intl.NumberFormat`, while module codes stay Latin
   in both locales — hence the `t-code` / `t-index` split.
9. **A Jalali period label** (شهریور ۱۴۰۵) in the Persian product UI, so
   the software looks like software an Iranian company would actually run.
10. **Sample data labelled as sample**, so a credible-looking table never
    implies real customers.
11. **`tone="raised"` (pure white) for two light zones** against the
    off-white page, giving quiet separation without a border or a colour
    change.
12. **The hero product is cropped by the viewport**, not framed in a
    device or a browser chrome — confidence, and it avoids the mockup
    clichés the brief bans.

---

## 12. Self-assessment against the brief's final test

- **Brand** — a proprietary system (rails, index, lockup, planes), the
  brand palette with a genuinely rare accent, 4–10px radius, no gradients
  beyond a data fill, none of the banned metaphors. Recognisable as RAVAND
  and not transferable to another company without rebuilding it.
- **Product** — visible in the first viewport, explorable in the
  configurator, and rendered in the brand's own system.
- **Business** — the visitor sees the module set, watches it reshape
  around a business model like theirs, and reaches one calm CTA that is
  also always in the masthead.
- **Trust** — dense, specific, output-oriented copy; no superlatives, no
  invented statistics, no testimonials.
- **International quality** — the restraint bar of the references without
  copying their layouts.
- **Simplicity** — seven zones, three tone changes, one interaction.
- **Originality** — the layouts (specification index, industry
  index+panel, live configurator, cropped product) are not the standard
  SaaS pattern, and the page never repeats its own composition.

---

## 13. Running it

See [`web/README.md`](../web/README.md). `npm run build` and `npm run lint`
both pass clean as of this report; all 19 routes prerender.
