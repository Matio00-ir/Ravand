import { useLocale, useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";

type Item = { title: string; description: string };

function index(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    minimumIntegerDigits: 2,
  }).format(n);
}

/**
 * Replaces the old testimonials marquee: those quotes had no verifiable
 * attribution (no company, no logo, nothing to check), which is a bigger
 * credibility risk than having no social proof at all. This answers the
 * question a serious buyer actually has instead — "what do I get?" —
 * with capabilities this product actually has, not invented praise.
 */
export function WhatYouGet() {
  const t = useTranslations("whatYouGet");
  const locale = useLocale();
  const items = t.raw("items") as Item[];

  return (
    <Zone tone="light" id="what-you-get">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <Reveal className="mt-14 md:mt-16">
          <div className="grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <div key={item.title} className="border-b border-e border-line bg-raised p-6">
                <span className="t-index text-steel">{index(i + 1, locale)}</span>
                <h3 className="t-h4 mt-4 text-ink">{item.title}</h3>
                <p className="t-body mt-2 text-ink-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Zone>
  );
}
