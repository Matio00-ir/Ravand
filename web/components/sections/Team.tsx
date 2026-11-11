import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { STORY, TEAM, pick } from "@/lib/company";

/**
 * The founding story and the people behind RAVAND, for /company/about.
 * Each part renders only when its data in lib/company.ts is filled; with
 * both empty the whole section is absent.
 */
export function Team() {
  const t = useTranslations("team");
  const locale = useLocale();
  if (TEAM.length === 0 && STORY.length === 0) return null;

  return (
    <Zone tone="light" id="team">
      <div className="shell zone">
        {STORY.length > 0 ? (
          <div className="grid gap-y-6 lg:grid-cols-12 lg:gap-x-8">
            <p className="t-label text-ink-muted lg:col-span-3">{t("storyLabel")}</p>
            <div className="lg:col-span-7">
              {STORY.map((p, i) => (
                <p key={i} className="t-lead mb-6 text-ink last:mb-0">
                  {pick(p, locale)}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {TEAM.length > 0 ? (
          <div className={STORY.length > 0 ? "mt-20 md:mt-24" : undefined}>
            <SectionHead label={t("label")} title={t("title")} />
            <Reveal className="mt-12 md:mt-14">
              <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {TEAM.map((m) => (
                  <li key={m.name.en || m.name.fa}>
                    {m.photo ? (
                      <Image
                        src={m.photo}
                        alt={pick(m.name, locale)}
                        width={400}
                        height={400}
                        className="aspect-square w-full rounded-[var(--radius-sm)] object-cover"
                      />
                    ) : null}
                    <p className="t-h4 mt-5 text-ink">{pick(m.name, locale)}</p>
                    <p className="t-small mt-1 text-ink-muted">{pick(m.role, locale)}</p>
                    {m.bio ? (
                      <p className="t-body mt-3 text-ink-muted">{pick(m.bio, locale)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        ) : null}
      </div>
    </Zone>
  );
}
