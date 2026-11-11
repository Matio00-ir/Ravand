import { useLocale, useTranslations } from "next-intl";
import { Zone } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";

type Tier = { code: string; name: string; description: string; points: string[] };

function index(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    minimumIntegerDigits: 2,
  }).format(n);
}

/**
 * The three ways to reach a system, from ready-made to deep configuration.
 * This is what the /solutions header ("three paths") promises; the page
 * used to repeat the home page's module grid instead.
 */
export function Tiers() {
  const t = useTranslations("pages.solutions");
  const locale = useLocale();
  const tiers = t.raw("tiers") as Tier[];

  return (
    <Zone tone="light" id="tiers">
      <div className="shell zone">
        <p className="t-lead max-w-2xl text-ink-muted">{t("intro")}</p>

        <Reveal className="mt-14 md:mt-16">
          <ol className="grid border-s border-t border-line lg:grid-cols-3">
            {tiers.map((tier, i) => (
              <li
                key={tier.code}
                id={`tier-${i + 1}`}
                className="flex scroll-mt-24 flex-col border-b border-e border-line bg-raised p-7 md:p-8"
              >
                <span className="t-index text-steel">{index(i + 1, locale)}</span>
                <h2 className="t-h3 mt-5 text-ink">{tier.name}</h2>
                <p className="t-body mt-3 text-ink-muted">{tier.description}</p>
                <div className="mt-auto pt-7">
                  <ul className="space-y-2 border-t border-line pt-5">
                    {tier.points.map((point) => (
                      <li key={point} className="t-small flex items-baseline gap-3 text-ink">
                        <span aria-hidden="true" className="h-px w-3 shrink-0 translate-y-[-0.25em] bg-steel" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Zone>
  );
}
