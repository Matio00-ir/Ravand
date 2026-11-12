import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";

type Step = { index: string; title: string; description: string; output: string };

/**
 * The engagement as a numbered register, with the deliverable named at
 * each stage. Five rows, one lattice, nothing decorative.
 */
export function Process() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as Step[];

  return (
    <Zone tone="raised">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <ol className="mt-14 border-t border-line md:mt-16">
          {steps.map((step) => (
            <Reveal
              as="li"
              key={step.index}
              className="grid gap-3 border-b border-line py-7 md:grid-cols-12 md:items-baseline md:gap-8"
            >
              <span className="t-index text-steel md:col-span-1">{step.index}</span>
              <h3 className="t-h4 text-ink md:col-span-3">{step.title}</h3>
              <p className="t-body text-ink-muted md:col-span-5">{step.description}</p>
              {/* Label on its own line, value below — run together on one
                  line they read as a single phrase ("خروجی پیکربندی پایه"). */}
              <div className="md:col-span-3 md:text-end">
                <p className="t-label text-steel">{t("outputLabel")}</p>
                {/* font-semibold sits on the span: .t-small is unlayered CSS
                    and sets font-weight itself, so it beats Tailwind's
                    layered utilities on the same element. */}
                <p className="t-small mt-1 text-ink">
                  <span className="font-semibold">{step.output}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Zone>
  );
}
