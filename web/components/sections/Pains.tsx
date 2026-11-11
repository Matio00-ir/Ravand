import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { ModuleIcon, type ModuleKey } from "@/components/system/ModuleIcon";

type Pain = { icon: ModuleKey; problem: string; fix: string };

/**
 * The buyer's own problems, each answered by what the product does about
 * it. Sits right after the hero so a visitor recognises their situation
 * before reading anything about modules. Every `fix` must stay true to
 * what the demo actually does — this is a promise, not a mood.
 */
export function Pains() {
  const t = useTranslations("pains");
  const items = t.raw("items") as Pain[];

  return (
    <Zone tone="light" id="pains">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <Reveal className="mt-14 md:mt-16">
          <ul className="grid border-s border-t border-line md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.problem}
                className="flex flex-col border-b border-e border-line bg-raised p-6 md:p-7"
              >
                <ModuleIcon name={item.icon} className="h-5 w-5 text-steel" />
                <p className="t-h4 mt-5 text-ink">{item.problem}</p>
                <div className="mt-auto pt-6">
                  <div className="border-t border-line pt-4">
                    <p className="t-label text-ink">{t("fixLabel")}</p>
                    <p className="t-body mt-2 text-ink-muted">{item.fix}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-10">
          <a href="#product" className="btn btn--sm btn--ghost-light">
            {t("cta")}
          </a>
        </div>
      </div>
    </Zone>
  );
}
