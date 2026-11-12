import NextLink from "next/link";
import { StatRow, StatTile, Table, Td, Tr, Panel } from "@/components/dashboard/ui";
import { AutoSelect } from "@/components/admin/forms";
import { A, Badge, Empty, LinkButton, Money, PageHeader, Tabs, fa, jdate, millions } from "@/components/admin/ui";
import { setDealStage } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { listDeals, type Deal } from "@/lib/admin/crm";
import { DEAL_SOURCES, DEAL_STAGES, OPEN_STAGES, labelOf, options } from "@/lib/admin/labels";
import { daysFromToday, msAgo } from "@/lib/admin/jalali";
import { isoOf } from "@/components/admin/ui";

export const metadata = { title: "فرصت‌های فروش" };

const STAGE_OPTS = options(DEAL_STAGES);

/** The sales pipeline: a board of open opportunities by stage, or a filterable list. */
export default async function DealsPage({ searchParams }: { searchParams: Promise<{ view?: string; stage?: string; source?: string }> }) {
  await requirePage("crm");
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const deals = await listDeals();

  const open = deals.filter((d) => (OPEN_STAGES as readonly string[]).includes(d.stage));
  const monthAgo = msAgo(30);
  const won30 = deals.filter((d) => d.stage === "won" && d.closed_at && d.closed_at.getTime() > monthAgo);
  const closed = deals.filter((d) => d.stage === "won" || d.stage === "lost");
  const winRate = closed.length ? Math.round((closed.filter((d) => d.stage === "won").length / closed.length) * 100) : 0;
  const new30 = deals.filter((d) => d.created_at.getTime() > monthAgo).length;

  const filtered = deals.filter((d) => (!sp.stage || d.stage === sp.stage) && (!sp.source || d.source === sp.source));

  return (
    <>
      <PageHeader
        title="فرصت‌های فروش"
        meta="همه سرنخ‌ها — از دمو و درخواست جلسه سایت تا تماس‌های ورودی — در یک قیف"
        actions={<LinkButton href="/admin/deals/new">فرصت جدید</LinkButton>}
      />

      <div className="space-y-6">
        <StatRow>
          <StatTile label="فرصت‌های باز" value={fa(open.length)} delta={`ارزش ${millions(open.reduce((s, d) => s + d.value, 0))} میلیون`} />
          <StatTile label="سرنخ‌های ۳۰ روز اخیر" value={fa(new30)} />
          <StatTile label="برنده‌شده در ۳۰ روز" value={fa(won30.length)} delta={`${millions(won30.reduce((s, d) => s + d.value, 0))} میلیون تومان`} trend="up" />
          <StatTile label="نرخ موفقیت" value={`${fa(winRate)}٪`} delta={`از ${fa(closed.length)} فرصت بسته‌شده`} />
        </StatRow>

        <Tabs
          items={[
            { href: "/admin/deals", label: "بُرد", active: view === "board" },
            { href: "/admin/deals?view=list", label: "فهرست", count: deals.length, active: view === "list" },
          ]}
        />

        {view === "board" ? (
          <div className="relative -mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
            <div className="grid min-w-[1100px] grid-cols-5 gap-3">
              {OPEN_STAGES.map((stage) => {
                const col = open.filter((d) => d.stage === stage);
                return (
                  <section key={stage} className="min-w-0 rounded-[var(--radius-md)] border border-line-dark bg-deep-raised">
                    <header className="flex items-baseline justify-between gap-2 border-b border-line-dark px-3.5 py-3">
                      <h2 className="text-[13px] font-semibold text-offwhite">{labelOf(DEAL_STAGES, stage)}</h2>
                      <span className="t-num text-[11.5px] text-steel">
                        {fa(col.length)} · {millions(col.reduce((s, d) => s + d.value, 0))}م
                      </span>
                    </header>
                    <ul className="space-y-2 p-2.5">
                      {col.length === 0 ? <li className="py-6 text-center text-[12px] text-steel/70">خالی</li> : null}
                      {col.map((d) => (
                        <DealCard key={d.id} deal={d} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <Panel flush>
            <div className="flex flex-wrap gap-4 p-5">
              <Tabs
                items={[
                  { href: "/admin/deals?view=list", label: "همه مراحل", active: !sp.stage },
                  ...STAGE_OPTS.map((o) => ({
                    href: `/admin/deals?view=list&stage=${o.value}`,
                    label: o.label,
                    count: deals.filter((d) => d.stage === o.value).length,
                    active: sp.stage === o.value,
                  })),
                ]}
              />
            </div>
            <Table
              head={[
                { label: "فرصت" },
                { label: "منبع", hideBelow: "md" },
                { label: "مرحله" },
                { label: "ارزش", align: "end", hideBelow: "sm" },
                { label: "به‌روزرسانی", hideBelow: "lg" },
                { label: "مسئول", hideBelow: "lg" },
              ]}
            >
              {filtered.length === 0 ? <Empty colSpan={6}>فرصتی با این فیلتر نیست.</Empty> : null}
              {filtered.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <A href={`/admin/deals/${d.id}`} className="block max-w-[18rem] truncate font-semibold">
                      {d.title}
                    </A>
                    <span className="mt-0.5 block text-[12px] text-steel">{[d.contact_name, d.mobile].filter(Boolean).join(" · ")}</span>
                  </Td>
                  <Td muted hideBelow="md">
                    {labelOf(DEAL_SOURCES, d.source)}
                  </Td>
                  <Td>
                    <Badge map={DEAL_STAGES} value={d.stage} />
                  </Td>
                  <Td align="end" hideBelow="sm">
                    <Money value={d.value} />
                  </Td>
                  <Td muted numeric hideBelow="lg">
                    {jdate(isoOf(d.updated_at))}
                  </Td>
                  <Td muted hideBelow="lg">
                    {d.owner_name ?? "—"}
                  </Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        )}
      </div>
    </>
  );
}

function DealCard({ deal: d }: { deal: Deal }) {
  const stale = daysFromToday(isoOf(d.updated_at)) <= -7;
  return (
    <li className="rounded-[var(--radius-sm)] border border-line-dark bg-deep p-3">
      <NextLink href={`/admin/deals/${d.id}`} className="block text-[13px] font-semibold leading-snug text-offwhite hover:underline">
        {d.title}
      </NextLink>
      <p className="mt-1 truncate text-[11.5px] text-steel">
        {labelOf(DEAL_SOURCES, d.source)}
        {d.contact_name ? ` · ${d.contact_name}` : ""}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]">
        <Money value={d.value} className="text-silver" />
        <span className="flex gap-2">
          {d.open_tasks ? <span className="text-silver">{fa(d.open_tasks)} کار</span> : null}
          {stale ? <span className="text-warning">بی‌پیگیری</span> : null}
        </span>
      </div>
      <div className="mt-2.5">
        <AutoSelect action={setDealStage} name="stage" value={d.stage} options={STAGE_OPTS} hidden={{ id: d.id }} label="تغییر مرحله" />
      </div>
    </li>
  );
}
