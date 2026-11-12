import { Panel, StatRow, StatTile, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, Money, PageHeader, Tabs, fa, millions } from "@/components/admin/ui";
import { inputClass } from "@/components/admin/forms";
import { requirePage } from "@/lib/admin/auth";
import { CUSTOMER_STATUSES, INDUSTRIES, labelOf, options } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "مشتریان" };

type Row = {
  id: number;
  name: string;
  industry: string | null;
  city: string | null;
  phone: string | null;
  status: string;
  active_contracts: number;
  arr: number;
  balance: number;
  open_tickets: number;
};

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePage("customers");
  const sp = await searchParams;
  const term = (sp.q ?? "").trim();

  const rows = await q<Row>(
    `SELECT c.id, c.name, c.industry, c.city, c.phone, c.status,
       (SELECT count(*)::int FROM adm_contracts k WHERE k.customer_id = c.id AND k.status = 'active') AS active_contracts,
       COALESCE((SELECT sum(amount) FROM adm_contracts k WHERE k.customer_id = c.id AND k.status = 'active' AND k.kind = 'support'), 0) AS arr,
       COALESCE((SELECT sum(total - paid) FROM adm_invoices i WHERE i.customer_id = c.id AND i.status IN ('issued', 'partial')), 0) AS balance,
       (SELECT count(*)::int FROM adm_tickets t WHERE t.customer_id = c.id AND t.status IN ('open', 'in_progress', 'waiting')) AS open_tickets
     FROM adm_customers c
     WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%' OR c.phone ILIKE '%' || $1 || '%' OR c.city ILIKE '%' || $1 || '%')
     ORDER BY c.created_at DESC LIMIT 500`,
    [term]
  );
  const shown = sp.status ? rows.filter((r) => r.status === sp.status) : rows;
  const qs = (extra: string) => `/admin/customers?${[term ? `q=${encodeURIComponent(term)}` : "", extra].filter(Boolean).join("&")}`;

  return (
    <>
      <PageHeader title="مشتریان" meta="پرونده هر مشتری: رابط‌ها، قراردادها، فاکتورها، پروژه‌ها و تیکت‌ها" actions={<LinkButton href="/admin/customers/new">مشتری جدید</LinkButton>} />
      <div className="space-y-6">
        <StatRow>
          <StatTile label="مشتریان" value={fa(rows.length)} />
          <StatTile label="با قرارداد فعال" value={fa(rows.filter((r) => r.active_contracts > 0).length)} />
          <StatTile label="درآمد سالانه پشتیبانی" value={millions(rows.reduce((s, r) => s + r.arr, 0))} unit="میلیون تومان" />
          <StatTile label="مطالبات باز" value={millions(rows.reduce((s, r) => s + r.balance, 0))} unit="میلیون تومان" />
        </StatRow>
        <Panel flush>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <Tabs
              items={[
                { href: qs(""), label: "همه", count: rows.length, active: !sp.status },
                ...options(CUSTOMER_STATUSES).map((o) => ({ href: qs(`status=${o.value}`), label: o.label, count: rows.filter((r) => r.status === o.value).length, active: sp.status === o.value })),
              ]}
            />
            <form method="get" className="w-full sm:w-64">
              <label className="sr-only" htmlFor="cq">جستجو</label>
              <input id="cq" name="q" defaultValue={term} placeholder="نام، تلفن یا شهر…" className={`${inputClass} py-2`} />
            </form>
          </div>
          <Table
            head={[
              { label: "مشتری" },
              { label: "حوزه", hideBelow: "lg" },
              { label: "وضعیت" },
              { label: "قرارداد فعال", align: "end", hideBelow: "md" },
              { label: "مانده بدهی", align: "end" },
              { label: "تیکت باز", align: "end", hideBelow: "sm" },
            ]}
          >
            {shown.length === 0 ? <Empty colSpan={6}>مشتری‌ای پیدا نشد.</Empty> : null}
            {shown.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <A href={`/admin/customers/${r.id}`} className="font-semibold">{r.name}</A>
                  <span className="mt-0.5 block text-[12px] text-steel">{[r.city, r.phone].filter(Boolean).join(" · ")}</span>
                </Td>
                <Td muted hideBelow="lg">{labelOf(INDUSTRIES, r.industry)}</Td>
                <Td><Badge map={CUSTOMER_STATUSES} value={r.status} /></Td>
                <Td align="end" numeric muted hideBelow="md">{fa(r.active_contracts)}</Td>
                <Td align="end"><Money value={r.balance} className={r.balance > 0 ? "text-offwhite" : "text-steel"} /></Td>
                <Td align="end" numeric muted hideBelow="sm">{fa(r.open_tickets)}</Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
