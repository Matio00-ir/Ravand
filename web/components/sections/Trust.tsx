import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";

type Entry = { question: string; answer: string };

/**
 * B2B trust register for the About page: the questions an enterprise
 * buyer actually asks before a vendor conversation. Same hairline-divided
 * list pattern as `Platform.tsx`'s module matrix and the /privacy,
 * /terms pages — no new visual pattern.
 */
export function Trust() {
  const t = useTranslations("trust");
  const entries = t.raw("entries") as Entry[];

  return (
    <Zone tone="raised" id="trust">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <Reveal className="mt-14 md:mt-16">
          <dl className="divide-y divide-line border-y border-line">
            {entries.map((entry) => (
              <div key={entry.question} className="grid gap-2 py-6 md:grid-cols-12 md:gap-6">
                <dt className="t-h4 text-ink md:col-span-4">{entry.question}</dt>
                <dd className="t-body text-ink-muted md:col-span-8">{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Zone>
  );
}
