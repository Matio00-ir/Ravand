import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { ProductionCostCalculator } from "@/components/product/ProductionCostCalculator";

type Industry = { id: string; name: string; description: string; focus: string; modules: string[] };
type Detail = { problem: string; processes: string[]; solution: string; advantage: string };

/**
 * One industry's dedicated page body: a numbered register (problem →
 * processes → RAVAND's solution → relevant modules → advantage), same
 * primitives and rhythm as `Process.tsx`/`Platform.tsx`. Base facts
 * (name/description/focus/modules) come from the existing `industries`
 * namespace already used by `Industries.tsx`, so this page can never say
 * something that contradicts the industries index — only the four
 * `Detail` fields are new, per-industry content.
 */
export function IndustryDetail({ id }: { id: string }) {
  const t = useTranslations("industries");
  const td = useTranslations("pages.industriesDetail");
  const items = t.raw("items") as Industry[];
  const industry = items.find((i) => i.id === id);
  const detail = td.raw(id) as Detail;

  if (!industry || !detail) return null;

  const rows = [
    { index: "01", title: td("labels.problem"), body: detail.problem },
    { index: "02", title: td("labels.processes"), list: detail.processes },
    { index: "03", title: td("labels.solution"), body: detail.solution },
    { index: "04", title: td("labels.modules"), chips: industry.modules },
    { index: "05", title: td("labels.advantage"), body: detail.advantage },
  ];

  return (
    <Zone tone="light" id="industry-detail">
      <div className="shell zone">
        <SectionHead label={t("focusLabel")} title={industry.focus} lead={industry.description} />

        <ol className="mt-14 border-t border-line md:mt-16">
          {rows.map((row) => (
            <Reveal
              as="li"
              key={row.index}
              className="grid gap-3 border-b border-line py-7 md:grid-cols-12 md:gap-8"
            >
              <span className="t-index text-steel md:col-span-1">{row.index}</span>
              <h3 className="t-h4 text-ink md:col-span-3">{row.title}</h3>
              <div className="t-body text-ink-muted md:col-span-8">
                {row.body ? <p>{row.body}</p> : null}
                {row.list ? (
                  <ul className="space-y-1.5">
                    {row.list.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-steel" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {row.chips ? (
                  <div className="flex flex-wrap gap-2">
                    {row.chips.map((code) => (
                      <span
                        key={code}
                        className="t-code rounded-[var(--radius-xs)] border border-line-strong px-2.5 py-1.5 text-ink-muted"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>

      {id === "manufacturing" ? <ManufacturingCostSection /> : null}
    </Zone>
  );
}

function ManufacturingCostSection() {
  const t = useTranslations("production");
  return (
    <div className="shell zone border-t border-line pt-16 md:pt-20">
      <SectionHead label={t("eyebrow")} title={t("title")} lead={t("lead")} />
      <Reveal className="mt-12">
        <ProductionCostCalculator />
      </Reveal>
    </div>
  );
}
