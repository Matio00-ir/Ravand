"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Zone } from "@/components/system/Zone";
import { Dashboard, ALL_MODULES } from "@/components/product/Dashboard";
import { ModuleIcon, type ModuleKey } from "@/components/system/ModuleIcon";
import { DemoLeadForm } from "@/components/sections/DemoLeadForm";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Preset = { id: string; name: string; modules: ModuleKey[] };
type Stage = { id: string; name: string };

function localNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}

/**
 * "ساخت روند من" — the panel-builder that /demo has become.
 *
 * Same customisation claim as the homepage's Configure zone (business
 * model → modules, the live Dashboard reconfiguring), taken further: a
 * dedicated flow that also lets a visitor lay out their own workflow and
 * see everything they chose recapped before they talk to the team. Reuses
 * configure's own preset/module data and the existing Dashboard component
 * — no second product surface invented for this page.
 */
export function RavandBuilder() {
  const locale = useLocale();
  const tConfigure = useTranslations("configure");
  const t = useTranslations("builder");
  const navLabel = useTranslations("product.nav");

  const presets = tConfigure.raw("presets") as Preset[];
  const workflowPresets = t.raw("workflowPresets") as Record<string, string[]>;
  const stepLabels = t.raw("steps") as string[];

  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<ModuleKey[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState(8);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = presets.find((p) => p.id === presetId) ?? null;
  const activeNav = activeModules.includes("erp") ? "erp" : activeModules[0];

  function goTo(next: number) {
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
    // Each step renders at a different height, so without this the user
    // can land far down the page staring at empty space above the fold —
    // the container's scrollMarginTop (inline style below) clears the
    // sticky navbar when scrollIntoView aligns to its top edge.
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectPreset(preset: Preset) {
    setPresetId(preset.id);
    setActiveModules(preset.modules);
    setStages(
      (workflowPresets[preset.id] ?? []).map((name, i) => ({
        id: `${preset.id}-${i}`,
        name,
      }))
    );
    track("business_selected", { businessType: preset.id });
    goTo(1);
  }

  function toggleModule(key: ModuleKey) {
    setActiveModules((prev) => {
      const on = prev.includes(key);
      if (on) {
        if (prev.length === 1) return prev; // keep at least one module
        return prev.filter((m) => m !== key);
      }
      return ALL_MODULES.filter((m) => m === key || prev.includes(m));
    });
  }

  function addStage() {
    setStages((prev) => [
      ...prev,
      { id: `stage-${prev.length}-${Date.now()}`, name: t("workflow.stagePlaceholder") },
    ]);
  }
  function removeStage(id: string) {
    setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }
  function renameStage(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  return (
    <Zone tone="light">
      <div ref={containerRef} className="shell zone" style={{ scrollMarginTop: "5rem" }}>
        {/* stepper */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-line pb-8">
          {stepLabels.map((label, i) => {
            const reachable = i <= maxStep;
            const on = i === step;
            return (
              <li key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && goTo(i)}
                  aria-current={on ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-colors duration-[var(--t-base)]",
                    on
                      ? "bg-black text-offwhite"
                      : reachable
                        ? "text-ink-muted hover:text-ink"
                        : "text-ink-muted/40"
                  )}
                >
                  <span className="t-index">{localNumber(i + 1, locale)}</span>
                  {label}
                </button>
                {i < stepLabels.length - 1 ? (
                  <span aria-hidden="true" className="h-px w-4 bg-line-strong" />
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* step 0 — business type */}
        {step === 0 ? (
          <div key="step-0" className="mt-12 animate-[panel-in_280ms_var(--ease-flow)_both]">
            <h2 className="t-h3 text-ink">{t("businessType.title")}</h2>
            <p className="t-body mt-4 max-w-xl text-ink-muted">{t("businessType.lead")}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-5 py-5 text-start transition-colors duration-[var(--t-base)]",
                    preset.id === presetId
                      ? "border-black bg-black text-offwhite"
                      : "border-line-strong text-ink hover:border-ink"
                  )}
                >
                  <span className="t-h4 block">{preset.name}</span>
                  <span
                    className={cn(
                      "t-small mt-2 block",
                      preset.id === presetId ? "text-ink-inverse-muted" : "text-ink-muted"
                    )}
                  >
                    {preset.modules.map((m) => navLabel(m)).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* step 1 — modules */}
        {step === 1 && current ? (
          <div key="step-1" className="mt-12 animate-[panel-in_280ms_var(--ease-flow)_both]">
            <h2 className="t-h3 text-ink">{t("modules.title")}</h2>
            <p className="t-body mt-4 max-w-xl text-ink-muted">{t("modules.lead")}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {ALL_MODULES.map((key) => {
                const on = activeModules.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleModule(key)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[var(--radius-xs)] border px-3 py-1.5 text-[12.5px] transition-colors duration-[var(--t-base)]",
                      on
                        ? "border-ink bg-black/[0.04] text-ink"
                        : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                    )}
                  >
                    <ModuleIcon name={key} className="h-3.5 w-3.5 shrink-0" />
                    {navLabel(key)}
                  </button>
                );
              })}
            </div>

            <div
              key={activeModules.join(",")}
              className="mt-8 animate-[panel-in_280ms_var(--ease-flow)_both] overflow-x-auto"
            >
              <Dashboard modules={activeModules} active={activeNav} className="min-w-[720px]" />
            </div>

            <StepNav
              onBack={() => goTo(0)}
              onNext={() => {
                track("modules_selected", { count: activeModules.length });
                goTo(2);
              }}
              backLabel={t("back")}
              nextLabel={t("next")}
            />
          </div>
        ) : null}

        {/* step 2 — workflow */}
        {step === 2 ? (
          <div key="step-2" className="mt-12 max-w-xl animate-[panel-in_280ms_var(--ease-flow)_both]">
            <h2 className="t-h3 text-ink">{t("workflow.title")}</h2>
            <p className="t-body mt-4 text-ink-muted">{t("workflow.lead")}</p>

            <ol className="mt-8 border-t border-line">
              {stages.map((stage, i) => (
                <li
                  key={stage.id}
                  className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 border-b border-line py-3"
                >
                  <span className="t-index text-steel">{localNumber(i + 1, locale)}</span>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => renameStage(stage.id, e.target.value)}
                    placeholder={t("workflow.stagePlaceholder")}
                    className="t-body min-w-0 rounded-[var(--radius-xs)] border border-transparent bg-transparent px-2 py-1.5 text-ink transition-colors duration-[var(--t-base)] hover:border-line focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeStage(stage.id)}
                    aria-label={t("workflow.removeStage")}
                    disabled={stages.length === 1}
                    className="t-small shrink-0 text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={addStage}
              className="t-small mt-5 border-b border-ink pb-0.5 text-ink"
            >
              + {t("workflow.addStage")}
            </button>

            <StepNav
              onBack={() => goTo(1)}
              onNext={() => {
                track("workflow_configured", { stages: stages.length });
                goTo(3);
              }}
              backLabel={t("back")}
              nextLabel={t("next")}
            />
          </div>
        ) : null}

        {/* step 3 — summary */}
        {step === 3 && current ? (
          <div key="step-3" className="mt-12 max-w-2xl animate-[panel-in_280ms_var(--ease-flow)_both]">
            <h2 className="t-h3 text-ink">{t("summary.title")}</h2>
            <p className="t-body mt-4 text-ink-muted">{t("summary.lead")}</p>

            <dl className="mt-8 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
              <div>
                <dt className="t-label text-ink-muted">{t("summary.businessTypeLabel")}</dt>
                <dd className="t-body mt-3 text-ink">{current.name}</dd>
              </div>
              <div>
                <dt className="t-label text-ink-muted">{t("summary.usersLabel")}</dt>
                <dd className="mt-3">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={users}
                    onChange={(e) => setUsers(Math.max(1, Number(e.target.value) || 1))}
                    className="t-num w-24 rounded-[var(--radius-xs)] border border-line-strong px-3 py-1.5 text-ink focus:border-ink focus:outline-none"
                  />
                </dd>
              </div>
              <div>
                <dt className="t-label text-ink-muted">{t("summary.modulesLabel")}</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {activeModules.map((m) => (
                    <span
                      key={m}
                      className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-line-strong px-2.5 py-1.5 text-[12.5px] text-ink-muted"
                    >
                      <ModuleIcon name={m} className="h-3.5 w-3.5" />
                      {navLabel(m)}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="t-label text-ink-muted">{t("summary.workflowLabel")}</dt>
                <dd className="t-body mt-3 text-ink">{stages.map((s) => s.name).join(" → ")}</dd>
              </div>
            </dl>

            <StepNav
              onBack={() => goTo(2)}
              onNext={() => {
                track("demo_completed", { businessType: current.id });
                goTo(4);
              }}
              backLabel={t("back")}
              nextLabel={t("finish")}
            />
          </div>
        ) : null}

        {/* step 4 — contact */}
        {step === 4 && current ? (
          <div key="step-4" className="mt-12 max-w-2xl animate-[panel-in_280ms_var(--ease-flow)_both]">
            <h2 className="t-h3 text-ink">{t("contact.title")}</h2>
            <p className="t-body mt-4 text-ink-muted">{t("contact.lead")}</p>

            <div className="mt-8 rounded-[var(--radius-md)] border border-line bg-page px-5 py-4">
              <p className="t-small text-ink-muted">
                <span className="t-label me-2 text-ink">{current.name}</span>
                {activeModules.map((m) => navLabel(m)).join(" · ")}
              </p>
              <p className="t-small mt-2 text-ink-muted">{t("contact.recapNote")}</p>
            </div>

            <div className="mt-8">
              <DemoLeadForm
                businessType={current.id}
                modules={activeModules}
                workflow={stages.map((s) => s.name)}
                userCount={users}
              />
            </div>

            <button
              type="button"
              onClick={() => goTo(3)}
              className="t-small mt-6 text-ink-muted hover:text-ink"
            >
              {t("back")}
            </button>
          </div>
        ) : null}
      </div>
    </Zone>
  );
}

function StepNav({
  onBack,
  onNext,
  backLabel,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-line pt-8">
      <button type="button" onClick={onBack} className="t-small text-ink-muted hover:text-ink">
        {backLabel}
      </button>
      <button type="button" onClick={onNext} className="btn btn--dark">
        {nextLabel}
      </button>
    </div>
  );
}
