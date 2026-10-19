import type { Metadata } from "next";
import NextLink from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { Panel, StatRow, StatTile, Status, type StatusTone, Table, Td, Tr } from "@/components/dashboard/ui";
import { FilterTabs } from "@/components/sandbox/views";
import { LeadControls, RequestControls, TeamLoginForm } from "@/components/team/TeamForms";
import { isTeamSession, teamPanelEnabled } from "@/lib/team-auth";
import { logoutTeam } from "@/lib/team-actions";
import { daysUntil, listLeads } from "@/lib/team-data";
import { listExpertRequests } from "@/lib/expert-requests";
import { formatNumber, formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false, nocache: true },
};

const requestTone: Record<string, StatusTone> = {
  new: "warning",
  contacted: "info",
  scheduled: "info",
  done: "success",
  cancelled: "neutral",
};

/**
 * The sales team's panel: every private demo with how much the customer
 * actually used it, and every expert-session request with its follow-up
 * status. Behind TEAM_PANEL_PASSWORD (see lib/team-auth.ts).
 */
export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "team" });

  if (!teamPanelEnabled() || !(await isTeamSession())) {
    return (
      <div className="grid min-h-screen place-items-center bg-deep px-6">
        <div className="w-full max-w-sm">
          <Logo tone="inverse" />
          <h1 className="t-h3 mt-8 text-offwhite">{t("login.title")}</h1>
          <p className="t-small mt-2 text-steel">{teamPanelEnabled() ? t("login.body") : t("login.errors.disabled")}</p>
          {teamPanelEnabled() ? (
            <div className="mt-6">
              <TeamLoginForm />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const active = tab === "requests" ? "requests" : "leads";
  const [leads, requests] = await Promise.all([listLeads(), listExpertRequests()]);
  const base = locale === "en" ? "/en/team" : "/team";
  const leadMobiles = new Set(leads.map((l) => l.mobile));
  const dateFmt = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const activeLeads = leads.filter((l) => l.status === "active" && daysUntil(l.expiresAt) > 0);
  const engaged = leads.filter((l) => l.actions > 0);
  const openRequests = requests.filter((r) => r.status === "new" || r.status === "contacted");

  return (
    <div className="min-h-screen bg-deep text-ink-inverse">
      <header className="sticky top-0 z-30 border-b border-line-dark bg-deep/95 backdrop-blur-md">
        <div className="flex h-16 items-center gap-6 px-5 md:px-8">
          <Logo tone="inverse" />
          <span className="t-label text-steel">{t("title")}</span>
          <form action={logoutTeam} className="ms-auto">
            <button type="submit" className="text-[12.5px] text-steel hover:text-silver">
              {t("logout")}
            </button>
          </form>
        </div>
      </header>

      <main className="space-y-6 px-5 py-6 md:px-8 md:py-8">
        <StatRow>
          <StatTile label={t("stats.leads")} value={formatNumber(leads.length, locale)} />
          <StatTile label={t("stats.active")} value={formatNumber(activeLeads.length, locale)} />
          <StatTile label={t("stats.engaged")} value={formatNumber(engaged.length, locale)} delta={t("stats.engagedHint")} />
          <StatTile
            label={t("stats.requests")}
            value={formatNumber(openRequests.length, locale)}
            trend={openRequests.length > 0 ? "down" : "flat"}
            delta={t("stats.requestsHint")}
          />
        </StatRow>

        <FilterTabs
          items={[
            { href: base, label: t("tabs.leads"), count: formatNumber(leads.length, locale), active: active === "leads" },
            {
              href: `${base}?tab=requests`,
              label: t("tabs.requests"),
              count: formatNumber(requests.length, locale),
              active: active === "requests",
            },
          ]}
        />

        {active === "leads" ? (
          <Panel flush>
            <Table
              head={[
                { label: t("leads.columns.lead") },
                { label: t("leads.columns.business"), hideBelow: "lg" },
                { label: t("leads.columns.trial") },
                { label: t("leads.columns.usage"), align: "end" },
                { label: t("leads.columns.actions") },
              ]}
            >
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-steel">
                    {t("leads.empty")}
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const left = daysUntil(l.expiresAt);
                  const state = l.status === "disabled" ? "disabled" : left <= 0 ? "expired" : "active";
                  return (
                    <Tr key={l.id}>
                      <Td>
                        <p className="font-semibold">{l.company}</p>
                        <p className="mt-0.5 text-[12px] text-silver">{l.name}</p>
                        <a href={`tel:${l.mobile}`} className="t-num mt-0.5 block text-[12px] text-steel hover:text-silver" dir="ltr">
                          {l.mobile}
                        </a>
                      </Td>
                      <Td muted hideBelow="lg">
                        {t(`business.${l.businessType}`)}
                        <span className="mt-0.5 block text-[12px] text-steel">
                          {t("leads.users", { count: formatNumber(l.userCount, locale) })}
                        </span>
                      </Td>
                      <Td>
                        <Status tone={state === "active" ? "success" : state === "expired" ? "neutral" : "error"}>
                          {t(`leads.state.${state}`)}
                        </Status>
                        <span className="t-num mt-1 block text-[12px] text-steel">
                          {state === "active"
                            ? t("leads.daysLeft", { days: formatNumber(left, locale) })
                            : formatShortDate(l.expiresAt, locale)}
                        </span>
                        <span className="t-num block text-[11.5px] text-steel">
                          {t("leads.created", { date: formatShortDate(l.createdAt, locale) })}
                        </span>
                      </Td>
                      <Td align="end">
                        <p className="t-num">{t("leads.visits", { count: formatNumber(l.accessCount, locale) })}</p>
                        <p className="t-num mt-0.5 text-[12px] text-silver">
                          {t("leads.actionsCount", { count: formatNumber(l.actions, locale), invoices: formatNumber(l.invoicesIssued, locale) })}
                        </p>
                        <p className="t-num mt-0.5 text-[11.5px] text-steel">
                          {l.lastAccessedAt ? t("leads.lastSeen", { date: formatShortDate(l.lastAccessedAt, locale) }) : t("leads.neverOpened")}
                        </p>
                      </Td>
                      <Td>
                        <LeadControls id={l.id} status={l.status} note={l.teamNote} />
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Table>
          </Panel>
        ) : (
          <Panel flush>
            <Table
              head={[
                { label: t("requests.columns.who") },
                { label: t("requests.columns.org"), hideBelow: "md" },
                { label: t("requests.columns.when") },
                { label: t("requests.columns.needs"), hideBelow: "lg" },
                { label: t("requests.columns.followUp") },
              ]}
            >
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-steel">
                    {t("requests.empty")}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <p className="font-semibold">{r.company}</p>
                      <p className="mt-0.5 text-[12px] text-silver">
                        {r.name}
                        {r.role ? ` · ${r.role}` : ""}
                      </p>
                      <a href={`tel:${r.mobile}`} className="t-num mt-0.5 block text-[12px] text-steel hover:text-silver" dir="ltr">
                        {r.mobile}
                      </a>
                      {leadMobiles.has(r.mobile) ? (
                        <span className="mt-1 inline-block text-[11.5px] text-[#9ab89f]">{t("requests.hasDemo")}</span>
                      ) : null}
                    </Td>
                    <Td muted hideBelow="md">
                      {t(`industries.${r.industry}`)}
                      <span className="mt-0.5 block text-[12px] text-steel">{t("requests.staff", { size: r.companySize })}</span>
                    </Td>
                    <Td>
                      <Status tone={requestTone[r.status] ?? "neutral"}>{t(`requests.statuses.${r.status}`)}</Status>
                      <span className="mt-1 block text-[12.5px] text-silver">{dateFmt.format(new Date(`${r.preferredDate}T12:00:00Z`))}</span>
                      <span className="block text-[12px] text-steel">{t(`requests.slots.${r.preferredSlot}`)}</span>
                    </Td>
                    <Td muted hideBelow="lg" className="max-w-[18rem] whitespace-pre-line text-[12.5px]">
                      {r.needs ?? "—"}
                    </Td>
                    <Td>
                      <RequestControls id={r.id} status={r.status} note={r.teamNote} />
                    </Td>
                  </Tr>
                ))
              )}
            </Table>
          </Panel>
        )}

        <p className="t-small text-steel">
          {t("footnote")}{" "}
          <NextLink href={locale === "en" ? "/en" : "/"} className="underline underline-offset-4 hover:text-silver">
            {t("backToSite")}
          </NextLink>
        </p>
      </main>
    </div>
  );
}
