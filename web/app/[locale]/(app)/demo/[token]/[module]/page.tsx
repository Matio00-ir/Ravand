import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { CrmContent } from "@/components/dashboard/CrmContent";
import { InventoryContent } from "@/components/dashboard/InventoryContent";
import { WorkflowContent } from "@/components/dashboard/WorkflowContent";
import { HrContent } from "@/components/dashboard/HrContent";
import { AnalyticsContent } from "@/components/dashboard/AnalyticsContent";
import { getLeadByToken } from "@/lib/demo-leads";
import { type ModuleKey } from "@/components/system/ModuleIcon";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const MODULES = ["crm", "inventory", "workflow", "hr", "analytics"] as const;
type ScreenModule = (typeof MODULES)[number];

/**
 * The module screens that share one shape (title + body, no bespoke
 * layout): Customers, Inventory, Workflow, People and Analytics. Finance,
 * Sales and Production keep their own static routes alongside this one.
 * A module the customer didn't pick 404s, matching the nav rail.
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

  const lead = await getLeadByToken(token);
  if (!lead) return null; // layout.tsx already gates this; defensive only.
  if (!lead.modules.includes(key as ModuleKey)) notFound();

  const m = await getTranslations({ locale, namespace: `dash.${key}` });

  const body = {
    crm: <CrmContent locale={locale} />,
    inventory: <InventoryContent locale={locale} />,
    workflow: <WorkflowContent locale={locale} stages={lead.workflow} />,
    hr: <HrContent locale={locale} />,
    analytics: <AnalyticsContent locale={locale} />,
  }[key];

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={m("title")} meta={m("meta")}>
      {body}
    </DemoShell>
  );
}
