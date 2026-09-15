"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Link } from "@/i18n/navigation";
import { Dashboard } from "@/components/product/Dashboard";
import { type ModuleKey } from "@/components/system/ModuleIcon";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Preset = { id: string; name: string; modules: ModuleKey[] };

/**
 * The product zone: one dark stretch where the system is both shown and
 * shown adapting. Picking a business model reconfigures the real surface,
 * which is the customisation claim demonstrated rather than illustrated.
 */
export function ProductZone() {
  const t = useTranslations("configure");
  const presets = t.raw("presets") as Preset[];

  const [presetId, setPresetId] = useState(presets[0].id);
  const current = presets.find((p) => p.id === presetId) ?? presets[0];
  const startedTracking = useRef(false);

  return (
    <Zone tone="deep" grid id="product">
      <div className="shell zone">
        <SectionHead
          tone="deep"
          label={t("label")}
          title={t("title")}
          lead={t("lead")}
        />

        {/* business model selector */}
        <div className="mt-12 flex flex-wrap items-center gap-2">
          <span className="t-label me-2 text-steel">{t("presetLabel")}</span>
          {presets.map((preset) => {
            const on = preset.id === presetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setPresetId(preset.id);
                  if (!startedTracking.current) {
                    startedTracking.current = true;
                    track("builder_start", { preset: preset.id });
                  }
                  track("module_select", { preset: preset.id });
                }}
                aria-pressed={on}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-4 py-2 text-[13px] font-medium transition-colors duration-[var(--t-base)]",
                  on
                    ? "border-transparent bg-offwhite text-black"
                    : "border-line-dark-strong text-silver hover:border-white/30 hover:text-offwhite"
                )}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        <div
          key={current.id}
          className="mt-8 animate-[panel-in_280ms_var(--ease-flow)_both]"
        >
          <Dashboard modules={current.modules} active={current.modules[0]} />
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line-dark pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-small max-w-2xl text-steel">{t("note")}</p>
          <Link
            href="/dashboard"
            onClick={() => track("builder_completion", { preset: current.id })}
            className="btn btn--sm btn--ghost-dark shrink-0"
          >
            {t("enter")}
          </Link>
        </div>
      </div>
    </Zone>
  );
}
