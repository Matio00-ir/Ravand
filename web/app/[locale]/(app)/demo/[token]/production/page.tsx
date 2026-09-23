import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { Panel, PanelHead } from "@/components/dashboard/ui";
import { ProductionCostCalculator } from "@/components/product/ProductionCostCalculator";
import { getLeadByToken, daysRemaining } from "@/lib/demo-leads";
import { buildTenantNav } from "@/lib/tenant-nav";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenProductionPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);
  if (!lead) return null;

  const t = await getTranslations({ locale, namespace: "demoEnv" });
  const p = await getTranslations({ locale, namespace: "production" });

  return (
    <DashboardShell
      title={p("title")}
      meta={p("lead")}
      basePath={`/demo/${token}`}
      nav={buildTenantNav(lead)}
      banner={t("banner", { company: lead.company, days: formatNumber(daysRemaining(lead), locale) })}
      workspaceName={lead.company}
      userName={lead.name}
      userRole={lead.company}
    >
      <Panel>
        <PanelHead title={p("resultTitle")} meta={p("eyebrow")} />
        <div className="mt-6">
          <ProductionCostCalculator dark />
        </div>
      </Panel>
    </DashboardShell>
  );
}
