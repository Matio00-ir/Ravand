import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { SalesContent } from "@/components/dashboard/SalesContent";
import { getLeadByToken, daysRemaining } from "@/lib/demo-leads";
import { buildTenantNav } from "@/lib/tenant-nav";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenSalesPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);
  if (!lead) return null;

  const t = await getTranslations({ locale, namespace: "demoEnv" });
  const s = await getTranslations({ locale, namespace: "dash.sales" });

  return (
    <DashboardShell
      title={s("title")}
      meta={s("meta")}
      basePath={`/demo/${token}`}
      nav={buildTenantNav(lead)}
      banner={t("banner", { company: lead.company, days: formatNumber(daysRemaining(lead), locale) })}
      workspaceName={lead.company}
      userName={lead.name}
      userRole={lead.company}
    >
      <SalesContent locale={locale} />
    </DashboardShell>
  );
}
