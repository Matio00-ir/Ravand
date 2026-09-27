import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel, PanelHead } from "@/components/dashboard/ui";
import { ProductionCostCalculator } from "@/components/product/ProductionCostCalculator";
import { getLeadByToken } from "@/lib/demo-leads";

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

  const p = await getTranslations({ locale, namespace: "production" });

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={p("title")} meta={p("lead")}>
      <Panel>
        <PanelHead title={p("resultTitle")} meta={p("eyebrow")} />
        <div className="mt-6">
          <ProductionCostCalculator dark />
        </div>
      </Panel>
    </DemoShell>
  );
}
