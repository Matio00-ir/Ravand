import { Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, EntityForm } from "@/components/admin/forms";
import { Empty, Money, PageHeader, Section, fa, jdate, millions } from "@/components/admin/ui";
import { deleteCampaign, saveCampaign } from "@/lib/admin/actions/system";
import { requirePage } from "@/lib/admin/auth";
import { campaignFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { CAMPAIGN_CHANNELS, DEAL_SOURCES, labelOf } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";
import { SITE_URL } from "@/lib/site";

export const metadata = { title: "کمپین‌ها و منابع لید" };

/**
 * Where leads come from and what they're worth: every deal is attributed
 * to its source (website demo, expert request, contact form, referral…)
 * and, for tagged links, to a campaign — so a campaign's cost per lead
 * and revenue are real numbers, not guesses.
 */
export default async function MarketingPage() {
  await requirePage("marketing");
  const [campaigns, bySource, byUtm] = await Promise.all([
    q<{ id: number; name: string; channel: string; utm_campaign: string | null; budget: number; spent: number; start_date: string | null; end_date: string | null; notes: string | null; leads: number; won: number; revenue: number }>(
      `SELECT k.*,
         (SELECT count(*)::int FROM adm_deals d WHERE k.utm_campaign IS NOT NULL AND lower(d.utm_campaign) = k.utm_campaign) AS leads,
         (SELECT count(*)::int FROM adm_deals d WHERE k.utm_campaign IS NOT NULL AND lower(d.utm_campaign) = k.utm_campaign AND d.stage = 'won') AS won,
         COALESCE((SELECT sum(d.value) FROM adm_deals d WHERE k.utm_campaign IS NOT NULL AND lower(d.utm_campaign) = k.utm_campaign AND d.stage = 'won'), 0) AS revenue
       FROM adm_campaigns k ORDER BY k.created_at DESC`
    ),
    q<{ source: string; leads: number; won: number; revenue: number; last30: number }>(
      `SELECT source, count(*)::int AS leads, count(*) FILTER (WHERE stage = 'won')::int AS won,
              COALESCE(sum(value) FILTER (WHERE stage = 'won'), 0) AS revenue,
              count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS last30
       FROM adm_deals GROUP BY source ORDER BY leads DESC`
    ),
    q<{ utm_source: string; leads: number; won: number }>(
      `SELECT COALESCE(utm_source, '') AS utm_source, count(*)::int AS leads, count(*) FILTER (WHERE stage = 'won')::int AS won
       FROM adm_deals WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY leads DESC LIMIT 15`
    ),
  ]);

  return (
    <>
      <PageHeader title="کمپین‌ها و منابع لید" meta="هر سرنخ از کجا آمده، چند تا به فروش رسیده و هر کمپین چقدر برگشت داشته" />
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="منابع سرنخ" meta="همه فرصت‌های فروش به تفکیک منبع" flush>
            <Table head={[{ label: "منبع" }, { label: "سرنخ", align: "end" }, { label: "۳۰ روز", align: "end", hideBelow: "sm" }, { label: "برنده", align: "end" }, { label: "نرخ", align: "end" }, { label: "فروش", align: "end", hideBelow: "md" }]}>
              {bySource.length === 0 ? <Empty colSpan={6}>هنوز سرنخی ثبت نشده است.</Empty> : null}
              {bySource.map((r) => (
                <Tr key={r.source}>
                  <Td>{labelOf(DEAL_SOURCES, r.source)}</Td>
                  <Td align="end" numeric>{fa(r.leads)}</Td>
                  <Td align="end" numeric muted hideBelow="sm">{fa(r.last30)}</Td>
                  <Td align="end" numeric>{fa(r.won)}</Td>
                  <Td align="end" numeric muted>{fa(r.leads ? Math.round((r.won / r.leads) * 100) : 0)}٪</Td>
                  <Td align="end" hideBelow="md"><Money value={r.revenue} /></Td>
                </Tr>
              ))}
            </Table>
          </Section>
          <Section title="utm_source سرنخ‌های سایت" meta="از لینک‌های برچسب‌دار و ارجاع سایت‌های دیگر" flush>
            <Table head={[{ label: "منبع" }, { label: "سرنخ", align: "end" }, { label: "برنده", align: "end" }]}>
              {byUtm.length === 0 ? <Empty colSpan={3}>هنوز سرنخی با برچسب UTM نیامده است.</Empty> : null}
              {byUtm.map((r) => (
                <Tr key={r.utm_source}>
                  <Td><span dir="ltr">{r.utm_source}</span></Td>
                  <Td align="end" numeric>{fa(r.leads)}</Td>
                  <Td align="end" numeric>{fa(r.won)}</Td>
                </Tr>
              ))}
            </Table>
          </Section>
        </div>

        <Section title="کمپین‌ها" meta="سرنخ‌ها با utm_campaign یکسان به کمپین نسبت داده می‌شوند" flush>
          <Table head={[{ label: "کمپین" }, { label: "هزینه", align: "end" }, { label: "سرنخ", align: "end" }, { label: "هزینه هر سرنخ", align: "end", hideBelow: "md" }, { label: "برنده", align: "end" }, { label: "بازگشت", align: "end", hideBelow: "sm" }]}>
            {campaigns.length === 0 ? <Empty colSpan={6}>کمپینی تعریف نشده است.</Empty> : null}
            {campaigns.map((k) => (
              <Tr key={k.id}>
                <Td>
                  <p className="font-semibold">{k.name}</p>
                  <p className="text-[12px] text-steel">
                    {labelOf(CAMPAIGN_CHANNELS, k.channel)}
                    {k.utm_campaign ? <span dir="ltr"> · {k.utm_campaign}</span> : null}
                    {k.start_date ? ` · ${jdate(k.start_date)}` : ""}
                  </p>
                </Td>
                <Td align="end"><Money value={k.spent} /></Td>
                <Td align="end" numeric>{fa(k.leads)}</Td>
                <Td align="end" hideBelow="md">{k.leads ? <Money value={Math.round(k.spent / k.leads)} /> : "—"}</Td>
                <Td align="end" numeric>{fa(k.won)}</Td>
                <Td align="end" hideBelow="sm">{k.spent ? `${fa(Math.round((k.revenue / k.spent) * 10) / 10)}×` : "—"}</Td>
              </Tr>
            ))}
          </Table>
        </Section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title="کمپین جدید">
            <EntityForm action={saveCampaign} fields={campaignFields} values={{ channel: "instagram" }} submitLabel="افزودن کمپین" resetOnSuccess />
          </Section>
          <Section title="ساخت لینک تبلیغ" meta="برای اینکه سرنخ‌ها به کمپین نسبت داده شوند">
            <p className="text-[13px] leading-relaxed text-silver">
              به انتهای هر لینکی که در تبلیغ، استوری یا پیامک می‌گذارید این برچسب‌ها را اضافه کنید. بازدیدکننده تا ۳۰ روز به همان کمپین نسبت داده می‌شود، حتی اگر روزهای بعد مستقیم به سایت بیاید.
            </p>
            <code className="t-code mt-4 block break-all rounded-[var(--radius-xs)] border border-line-dark bg-deep p-3 text-[12px] text-offwhite" dir="ltr">
              {SITE_URL}/?utm_source=instagram&amp;utm_medium=story&amp;utm_campaign=YOUR-CAMPAIGN
            </code>
          </Section>
        </div>

        {campaigns.length ? (
          <div className="space-y-4">
            <h2 className="t-h4 text-offwhite">ویرایش کمپین‌ها</h2>
            {campaigns.map((k) => (
              <Section key={k.id} title={k.name} meta={`${millions(k.spent)} میلیون از ${millions(k.budget)} میلیون بودجه`}>
                <EntityForm action={saveCampaign} fields={campaignFields} values={valuesFor(campaignFields, k)} hidden={{ id: k.id }} />
                <div className="mt-3">
                  <ActionButton action={deleteCampaign} hidden={{ id: k.id }} label="حذف کمپین" small variant="danger" confirm="این کمپین حذف شود؟" />
                </div>
              </Section>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
