import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { CUSTOMERS, pick } from "@/lib/company";

/**
 * Real customers, from lib/company.ts. Renders NOTHING while the list is
 * empty — no placeholder, no "coming soon". Only add businesses that
 * agreed to be named; an unverifiable name hurts more than no name
 * (that is why the old testimonials marquee was removed).
 */
export function Customers() {
  const t = useTranslations("customers");
  const locale = useLocale();
  if (CUSTOMERS.length === 0) return null;

  const quoted = CUSTOMERS.filter((c) => c.quote);

  return (
    <Zone tone="raised" id="customers">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} />

        <Reveal className="mt-12 md:mt-14">
          <ul className="grid grid-cols-2 border-s border-t border-line sm:grid-cols-3 lg:grid-cols-4">
            {CUSTOMERS.map((c) => (
              <li
                key={c.name.en || c.name.fa}
                className="flex min-h-28 flex-col justify-center gap-2 border-b border-e border-line bg-page p-6"
              >
                {c.logo ? (
                  <Image
                    src={c.logo}
                    alt={pick(c.name, locale)}
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain object-start opacity-80 grayscale"
                  />
                ) : (
                  <p className="t-h4 text-ink">{pick(c.name, locale)}</p>
                )}
                <p className="t-small text-ink-muted">{pick(c.industry, locale)}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        {quoted.length > 0 ? (
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {quoted.map((c) => (
              <figure key={`q-${c.name.en || c.name.fa}`} className="border-t border-ink pt-6">
                <blockquote className="t-lead text-ink">«{pick(c.quote!, locale)}»</blockquote>
                <figcaption className="t-small mt-4 text-ink-muted">
                  {c.quoteBy ? `${pick(c.quoteBy, locale)}${locale === "fa" ? "، " : ", "}` : ""}
                  {pick(c.name, locale)}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </Zone>
  );
}
