"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Zone, SectionHead } from "@/components/system/Zone";
import { Dashboard } from "@/components/product/Dashboard";
import { type ModuleKey } from "@/components/system/ModuleIcon";
import { cn } from "@/lib/utils";

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
                onClick={() => setPresetId(preset.id)}
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

        <p className="t-small mt-6 max-w-2xl text-steel">{t("note")}</p>
      </div>
    </Zone>
  );
}
