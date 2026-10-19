import { type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { Link } from "@/i18n/navigation";
import { type DemoLead, daysRemaining } from "@/lib/demo-leads";
import { buildTenantNav } from "@/lib/tenant-nav";
import { formatNumber } from "@/lib/format";

/** "Sara Mohammadi" → "SM"; Persian initials are joined with a ZWNJ so they don't connect. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((p) => p[0]);
  return /[؀-ۿ]/.test(name) ? letters.join("‌") : letters.join("").toUpperCase();
}

/**
 * The shell every /demo/[token] screen renders inside: the customer's own
 * nav rail, trial banner, workspace and user card. Kept in one place so
 * each module page only supplies its title and body.
 */
export async function DemoShell({
  lead,
  token,
  locale,
  title,
  meta,
  actions,
  children,
}: {
  lead: DemoLead;
  token: string;
  locale: string;
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "demoEnv" });

  return (
    <DashboardShell
      title={title}
      meta={meta}
      actions={actions}
      basePath={`/demo/${token}`}
      nav={buildTenantNav(lead)}
      banner={
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{t("banner", { company: lead.company, days: formatNumber(daysRemaining(lead), locale) })}</span>
          <Link href="/demo/expert" className="text-silver underline decoration-white/20 underline-offset-4 hover:text-offwhite">
            {t("bookExpert")}
          </Link>
        </span>
      }
      workspaceName={lead.company}
      userName={lead.name}
      userRole={lead.company}
      userInitials={initialsOf(lead.name)}
    >
      {children}
    </DashboardShell>
  );
}
