import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { OverviewContent } from "@/components/dashboard/OverviewContent";
import { Panel } from "@/components/dashboard/ui";
import { ModuleIcon } from "@/components/system/ModuleIcon";
import { getLeadByToken, daysRemaining } from "@/lib/demo-leads";
import { buildTenantNav } from "@/lib/tenant-nav";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);
  if (!lead) return null; // layout.tsx already gates this; defensive only.

  const t = await getTranslations({ locale, namespace: "demoEnv" });
  const navLabel = await getTranslations({ locale, namespace: "product.nav" });
  const o = await getTranslations({ locale, namespace: "dash.overview" });

  const days = daysRemaining(lead);
  const nav = buildTenantNav(lead);

  return (
    <DashboardShell
      title={o("title")}
      meta={o("meta")}
      basePath={`/demo/${token}`}
      nav={nav}
      banner={t("banner", { company: lead.company, days: formatNumber(days, locale) })}
      workspaceName={lead.company}
      userName={lead.name}
      userRole={lead.company}
    >
      <div className="min-w-0 space-y-6">
        <Panel>
          <p className="t-label text-steel">{t("ready.eyebrow")}</p>
          <h1 className="t-h3 mt-3 text-offwhite">
            {t("ready.title", { company: lead.company })}
          </h1>
          <p className="t-body mt-3 max-w-xl text-silver">{t("ready.lead")}</p>

          <dl className="mt-6 grid gap-6 border-t border-line-dark pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="t-label text-steel">{t("ready.trialLabel")}</dt>
              <dd className="t-num mt-2 text-[1.1rem] font-bold text-offwhite">
                {t("ready.daysLeft", { days: formatNumber(days, locale) })}
              </dd>
              <dd className="t-small mt-1 text-steel">
                {t("ready.expiresOn", { date: formatDate(lead.expiresAt, locale) })}
              </dd>
            </div>
            <div>
              <dt className="t-label text-steel">{t("ready.usersLabel")}</dt>
              <dd className="t-num mt-2 text-[1.1rem] font-bold text-offwhite">
                {formatNumber(lead.userCount, locale)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="t-label text-steel">{t("ready.modulesLabel")}</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {lead.modules.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-line-dark px-2.5 py-1.5 text-[12px] text-silver"
                  >
                    <ModuleIcon name={m} className="h-3.5 w-3.5" />
                    {navLabel(m)}
                  </span>
                ))}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="t-label text-steel">{t("ready.workflowLabel")}</dt>
              <dd className="t-small mt-2 text-silver">{lead.workflow.join(" → ")}</dd>
            </div>
          </dl>
        </Panel>

        <OverviewContent locale={locale} />
      </div>
    </DashboardShell>
  );
}
