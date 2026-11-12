import { Panel, Table, Td, Tr } from "@/components/dashboard/ui";
import { A, Badge, Empty, LinkButton, Money, PageHeader, Tabs, jdate } from "@/components/admin/ui";
import { requirePage } from "@/lib/admin/auth";
import { QUOTE_STATUSES, options } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "پیش‌فاکتورها" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePage("crm");
  const { status } = await searchParams;
  const rows = await q<{ id: number; number: string; title: string; status: string; total: number; issued_at: string; valid_until: string; party: string | null; deal_id: number | null }>(
    `SELECT qu.id, qu.number, qu.title, qu.status, qu.total, qu.issued_at, qu.valid_until, qu.deal_id,
            COALESCE(c.name, d.company, d.title) AS party
     FROM adm_quotes qu LEFT JOIN adm_customers c ON c.id = qu.customer_id LEFT JOIN adm_deals d ON d.id = qu.deal_id
     ORDER BY qu.created_at DESC LIMIT 500`
  );
  const shown = status ? rows.filter((r) => r.status === status) : rows;

  return (
    <>
      <PageHeader
        title="پیش‌فاکتورها"
        meta="پیشنهاد قیمت برای فرصت‌های فروش؛ پیش‌فاکتور پذیرفته‌شده به قرارداد تبدیل می‌شود"
        actions={<LinkButton href="/admin/quotes/new">پیش‌فاکتور جدید</LinkButton>}
      />
      <Panel flush>
        <div className="p-5">
          <Tabs
            items={[
              { href: "/admin/quotes", label: "همه", count: rows.length, active: !status },
              ...options(QUOTE_STATUSES).map((o) => ({
                href: `/admin/quotes?status=${o.value}`,
                label: o.label,
                count: rows.filter((r) => r.status === o.value).length,
                active: status === o.value,
              })),
            ]}
          />
        </div>
        <Table
          head={[
            { label: "شماره" },
            { label: "طرف" },
            { label: "عنوان", hideBelow: "lg" },
            { label: "تاریخ", hideBelow: "md" },
            { label: "مبلغ", align: "end" },
            { label: "وضعیت" },
          ]}
        >
          {shown.length === 0 ? <Empty colSpan={6}>پیش‌فاکتوری نیست.</Empty> : null}
          {shown.map((r) => (
            <Tr key={r.id}>
              <Td>
                <A href={`/admin/quotes/${r.id}`} className="t-code">{r.number}</A>
              </Td>
              <Td>{r.party ?? "—"}</Td>
              <Td muted hideBelow="lg">{r.title}</Td>
              <Td muted numeric hideBelow="md">{jdate(r.issued_at)}</Td>
              <Td align="end"><Money value={r.total} /></Td>
              <Td><Badge map={QUOTE_STATUSES} value={r.status} /></Td>
            </Tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
