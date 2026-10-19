import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { CrmContent } from "@/components/dashboard/CrmContent";
import { InventoryContent } from "@/components/dashboard/InventoryContent";
import { WorkflowContent } from "@/components/dashboard/WorkflowContent";
import { HrContent } from "@/components/dashboard/HrContent";
import { AnalyticsContent } from "@/components/dashboard/AnalyticsContent";

const MODULES = ["crm", "inventory", "workflow", "hr", "analytics"] as const;
type TourModule = (typeof MODULES)[number];

export function generateStaticParams() {
  return MODULES.map((module) => ({ module }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; module: string }>;
}): Promise<Metadata> {
  const { locale, module } = await params;
  if (!MODULES.includes(module as TourModule)) return {};
  const t = await getTranslations({ locale, namespace: `dash.${module}` });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The rest of the public tour's screens — the same sample bodies the
 * per-customer demo uses for its sample-only modules. Overview, Sales and
 * Finance keep their own static routes alongside this one.
 */
export default async function TourModulePage({
  params,
}: {
  params: Promise<{ locale: string; module: string }>;
}) {
  const { locale, module } = await params;
  setRequestLocale(locale);
  if (!MODULES.includes(module as TourModule)) notFound();
  const key = module as TourModule;

  const m = await getTranslations({ locale, namespace: `dash.${key}` });
  // The tour's workflow board uses the manufacturing preset's stages —
  // a per-customer demo shows the stages that customer laid out instead.
  const presets = (await getTranslations({ locale, namespace: "builder" })).raw("workflowPresets") as Record<string, string[]>;
  const body = {
    crm: <CrmContent locale={locale} />,
    inventory: <InventoryContent locale={locale} />,
    workflow: <WorkflowContent locale={locale} stages={presets.manufacturing ?? []} />,
    hr: <HrContent locale={locale} />,
    analytics: <AnalyticsContent locale={locale} />,
  }[key];

  return (
    <DashboardShell title={m("title")} meta={m("meta")} tour={key}>
      {body}
    </DashboardShell>
  );
}
