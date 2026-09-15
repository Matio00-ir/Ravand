"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Link } from "@/i18n/navigation";
import type { Pathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Industry = {
  id: string;
  name: string;
  description: string;
  focus: string;
  modules: string[];
};

// Every id in `industries.items` (messages/*.json) has a dedicated page —
// mapped explicitly rather than built as a template string, so an unknown
// id can't silently produce a broken link.
const DETAIL_HREF: Record<string, Pathname> = {
  manufacturing: "/industries/manufacturing",
  trading: "/industries/trading",
  retail: "/industries/retail",
  services: "/industries/services",
  fitness: "/industries/fitness",
  healthcare: "/industries/healthcare",
};

/**
 * Industries as a selectable index against one detail panel — a platform
 * with many business models, and a list that is obviously extensible.
 */
export function Industries() {
  const t = useTranslations("industries");
  const items = t.raw("items") as Industry[];
  const [activeId, setActiveId] = useState(items[0].id);
  const active = items.find((i) => i.id === activeId) ?? items[0];
  const tc = useTranslations("common");

  return (
    <Zone tone="light" id="industries">
      <div className="shell zone">
        <SectionHead label={t("label")} title={t("title")} lead={t("lead")} />

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0">
              {items.map((item) => {
                const on = item.id === active.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveId(item.id);
                      track("industry_select", { industry: item.id });
                    }}
                    aria-pressed={on}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] border px-4 py-3 text-start text-[14px] transition-colors duration-[var(--t-base)] lg:w-full lg:whitespace-normal lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-0 lg:py-4",
                      on
                        ? "border-black bg-black font-semibold text-offwhite lg:bg-transparent lg:text-ink"
                        : "border-line-strong text-ink-muted hover:text-ink lg:border-line"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "hidden h-px bg-ink transition-all duration-[var(--t-slow)] lg:block",
                          on ? "w-6" : "w-0"
                        )}
                      />
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            <div key={active.id} className="animate-[panel-in_280ms_var(--ease-flow)_both]">
              <h3 className="t-h3 text-ink">{active.name}</h3>
              <p className="t-lead mt-5 max-w-2xl text-ink-muted">
                {active.description}
              </p>

              <dl className="mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
                <div>
                  <dt className="t-label text-ink-muted">{t("focusLabel")}</dt>
                  <dd className="t-body mt-3 text-ink">{active.focus}</dd>
                </div>
                <div>
                  <dt className="t-label text-ink-muted">{t("modulesLabel")}</dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {active.modules.map((code) => (
                      <span
                        key={code}
                        className="t-code rounded-[var(--radius-xs)] border border-line-strong px-2.5 py-1.5 text-ink-muted"
                      >
                        {code}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              {DETAIL_HREF[active.id] ? (
                <Link
                  href={DETAIL_HREF[active.id]}
                  className="t-small mt-8 inline-flex items-center gap-1.5 text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-[var(--t-base)] hover:decoration-ink"
                >
                  {tc("learnMore")}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Zone>
  );
}
