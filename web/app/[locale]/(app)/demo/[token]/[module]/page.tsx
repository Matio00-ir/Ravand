import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { WorkflowContent } from "@/components/dashboard/WorkflowContent";
import { HrContent } from "@/components/dashboard/HrContent";
import { AnalyticsContent } from "@/components/dashboard/AnalyticsContent";
import { loadLead } from "@/lib/sandbox/context";
import { type ModuleKey } from "@/components/system/ModuleIcon";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const MODULES = ["workflow", "hr", "analytics"] as const;
type ScreenModule = (typeof MODULES)[number];

/**
 * The modules that are still sample screens in the sandbox: Workflow,
 * People and Analytics. Sales, Customers, Inventory and Finance are real
 * and have their own routes alongside this one. Each sample screen says
 * so up front, so nobody mistakes it for their own data. A module the
 * customer didn't pick 404s, matching the nav rail.
 */
export default async function DemoTokenModulePage({
  params,
}: {
  params: Promise<{ locale: string; token: string; module: string }>;
}) {
  const { locale, token, module } = await params;
  setRequestLocale(locale);

  if (!MODULES.includes(module as ScreenModule)) notFound();
  const key = module as ScreenModule;

  const lead = await loadLead(token, locale);
  if (!lead) return null; // layout.tsx already gates this; defensive only.
  if (!lead.modules.includes(key as ModuleKey)) notFound();

  const m = await getTranslations({ locale, namespace: `dash.${key}` });
  const s = await getTranslations({ locale, namespace: "sandbox.sampleScreen" });

  const body = {
    workflow: <WorkflowContent locale={locale} stages={lead.workflow} />,
    hr: <HrContent locale={locale} />,
    analytics: <AnalyticsContent locale={locale} />,
  }[key];

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={m("title")} meta={m("meta")}>
      <div className="min-w-0 space-y-6">
        <p className="rounded-[var(--radius-sm)] border border-line-dark-strong bg-white/[0.03] px-4 py-3 text-[13px] text-silver">
          {s("notice")}
        </p>
        {body}
      </div>
    </DemoShell>
  );
}
