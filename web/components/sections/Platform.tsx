import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Reveal } from "@/components/system/Reveal";
import { ModuleIcon, type ModuleKey } from "@/components/system/ModuleIcon";
import { cn } from "@/lib/utils";

type Module = { key: ModuleKey; code: string; name: string; description: string };

/**
 * The module set as an even matrix — one hairline lattice, four columns,
 * identical cells. Ordered by construction rather than composed by eye.
 */
export function Platform() {
  const t = useTranslations("platform");
  const modules = t.raw("modules") as Module[];

  return (
    <Zone tone="light" id="platform">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <Reveal className="mt-14 md:mt-16">
          <div className="grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <div
                key={m.key}
                className={cn(
                  "group border-b border-e border-line bg-raised p-6 transition-colors duration-[var(--t-base)] hover:bg-page"
                )}
              >
                <div className="flex items-center justify-between">
                  <ModuleIcon
                    name={m.key}
                    className="h-[18px] w-[18px] text-steel transition-colors duration-[var(--t-base)] group-hover:text-ink"
                  />
                  <span className="t-code text-steel">{m.code}</span>
                </div>
                <h3 className="t-h4 mt-5 text-ink">{m.name}</h3>
                <p className="t-body mt-2 text-ink-muted">{m.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Zone>
  );
}
