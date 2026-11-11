"use client";

import { useId, useState } from "react";
import { getImageProps } from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Tab = { id: string; label: string; title: string; points: string[] };

/**
 * One screen as art-directed <picture>, built with getImageProps so both
 * sources still go through Next's image optimizer.
 */
function Screen({ locale, id, alt, on }: { locale: string; id: string; alt: string; on: boolean }) {
  const common = { alt: on ? alt : "" };
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    src: `/product/${locale}-${id}.png`,
    width: 2160,
    height: 1350,
    sizes: "(min-width: 1024px) 60vw, 100vw",
  });
  const {
    props: { srcSet: mobileSrcSet, ...mobile },
  } = getImageProps({
    ...common,
    src: `/product/${locale}-${id}-mobile.png`,
    width: 780,
    height: 1560,
    sizes: "300px",
  });

  return (
    // Hidden screens carry alt="", so screen readers skip them.
    <picture
      className={cn(
        "col-start-1 row-start-1 transition-opacity duration-[var(--t-base)]",
        on ? "opacity-100" : "opacity-0"
      )}
    >
      <source media="(min-width: 768px)" srcSet={desktop} sizes="(min-width: 1024px) 60vw, 100vw" />
      <source srcSet={mobileSrcSet} sizes="300px" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...mobile} className="block h-auto w-full" />
    </picture>
  );
}

/**
 * Real screens from the tour (/dashboard), captured by
 * scripts/capture-product-shots.mjs into public/product/<locale>-<id>.png.
 * They replace the home page's text-only module cards: a buyer trusts
 * what they can see far more than a list of capability names.
 *
 * Tabs follow the WAI-ARIA tabs pattern (tablist / tab / tabpanel).
 */
export function ProductGallery() {
  const t = useTranslations("gallery");
  const locale = useLocale() === "en" ? "en" : "fa";
  const tabs = t.raw("tabs") as Tab[];
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const base = useId();

  return (
    <Zone tone="raised" id="inside">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <div role="tablist" aria-label={t("label")} className="mt-12 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const on = tab.id === active.id;
            return (
              <button
                key={tab.id}
                id={`${base}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${base}-panel`}
                onClick={() => {
                  setActiveId(tab.id);
                  track("gallery_tab", { tab: tab.id });
                }}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-4 py-2 text-[13px] font-medium transition-colors duration-[var(--t-base)]",
                  on
                    ? "border-transparent bg-ink text-offwhite"
                    : "border-line text-ink-muted hover:border-ink hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${active.id}`}
          className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10"
        >
          <div className="lg:col-span-8">
            {/* All four screens are stacked in one grid cell and cross-fade.
                Because the hidden ones stay in the layout (opacity, not
                display:none), lazy loading fetches them as soon as the
                section scrolls into view — so switching tabs is instant. */}
            {/* Each screen is a <picture>: a desktop source from md up and a
                phone source below (a desktop shot squeezed to phone width is
                unreadable). The browser downloads only the matching one. */}
            <div className="mx-auto grid max-w-[300px] overflow-hidden rounded-[1.25rem] border border-line-dark bg-deep shadow-[0_30px_80px_-40px_rgba(11,13,16,0.55)] md:max-w-none md:rounded-[var(--radius-md)]">
              {tabs.map((tab) => (
                <Screen
                  key={tab.id}
                  locale={locale}
                  id={tab.id}
                  alt={t("alt", { tab: tab.label })}
                  on={tab.id === active.id}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <h3 className="t-h3 text-ink">{active.title}</h3>
            <ul className="mt-5 space-y-3">
              {active.points.map((point) => (
                <li key={point} className="t-body flex items-baseline gap-3 text-ink-muted">
                  <span aria-hidden="true" className="h-px w-3 shrink-0 translate-y-[-0.3em] bg-ink" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              onClick={() => track("demo_open", { cta: "gallery", tab: active.id })}
              className="btn btn--sm btn--dark mt-7"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </Zone>
  );
}
