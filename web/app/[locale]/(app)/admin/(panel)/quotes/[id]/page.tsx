import { notFound } from "next/navigation";
import { ActionButton, AutoSelect } from "@/components/admin/forms";
import { DocSheet } from "@/components/admin/DocSheet";
import { PrintButton } from "@/components/admin/PrintButton";
import { Badge, LinkButton, PageHeader } from "@/components/admin/ui";
import { deleteQuote, quoteToContract, setQuoteStatus } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { QUOTE_STATUSES, options } from "@/lib/admin/labels";
import { q, q1 } from "@/lib/admin/schema";
import { getCompany } from "@/lib/admin/settings";

export const metadata = { title: "پیش‌فاکتور" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("crm");
  const { id } = await params;
  if (!/^\d{1,15}$/.test(id)) notFound();
  const quote = await q1<{
    id: number; number: string; title: string; status: string; issued_at: string; valid_until: string;
    subtotal: number; discount: number; tax: number; total: number; notes: string | null;
    deal_id: number | null; deal_title: string | null; customer_id: number | null;
    c_name: string | null; national_id: string | null; economic_code: string | null; address: string | null; postal_code: string | null; phone: string | null;
    d_company: string | null; d_contact: string | null; d_mobile: string | null;
    contract_id: number | null;
  }>(
    `SELECT qu.*, d.title AS deal_title, c.name AS c_name, c.national_id, c.economic_code, c.address, c.postal_code, c.phone,
            d.company AS d_company, d.contact_name AS d_contact, d.mobile AS d_mobile,
            (SELECT id FROM adm_contracts k WHERE k.quote_id = qu.id LIMIT 1) AS contract_id
     FROM adm_quotes qu LEFT JOIN adm_customers c ON c.id = qu.customer_id LEFT JOIN adm_deals d ON d.id = qu.deal_id
     WHERE qu.id = $1`,
    [Number(id)]
  );
  if (!quote) notFound();
  const [lines, company] = await Promise.all([
    q<{ description: string; qty: number; unit_price: number; line_total: number }>(
      `SELECT description, qty, unit_price, line_total FROM adm_quote_lines WHERE quote_id = $1 ORDER BY id`,
      [quote.id]
    ),
    getCompany(),
  ]);

  const buyer = quote.c_name
    ? { name: quote.c_name, national_id: quote.national_id, economic_code: quote.economic_code, address: quote.address, postal_code: quote.postal_code, phone: quote.phone }
    : { name: quote.d_company || quote.d_contact || "—", phone: quote.d_mobile };

  return (
    <>
      <PageHeader
        title={`پیش‌فاکتور ${quote.number}`}
        meta={<Badge map={QUOTE_STATUSES} value={quote.status} />}
        back={quote.deal_id ? { href: `/admin/deals/${quote.deal_id}`, label: quote.deal_title ?? "فرصت" } : { href: "/admin/quotes", label: "پیش‌فاکتورها" }}
        actions={
          <>
            <div className="w-44">
              <AutoSelect action={setQuoteStatus} name="status" value={quote.status} options={options(QUOTE_STATUSES)} hidden={{ id: quote.id }} label="وضعیت" />
            </div>
            <PrintButton />
            {quote.contract_id ? (
              <LinkButton href={`/admin/contracts/${quote.contract_id}`}>قرارداد</LinkButton>
            ) : (
              <ActionButton action={quoteToContract} hidden={{ id: quote.id }} label="تبدیل به قرارداد" variant="primary" confirm="پیش‌فاکتور پذیرفته شده و قرارداد پیش‌نویس ساخته شود؟" />
            )}
            <ActionButton action={deleteQuote} hidden={{ id: quote.id }} label="حذف" variant="danger" confirm="این پیش‌فاکتور حذف شود؟" />
          </>
        }
      />
      <DocSheet
        kind="پیش‌فاکتور"
        number={quote.number}
        issued={quote.issued_at}
        due={quote.valid_until}
        dueLabel="اعتبار تا"
        seller={company}
        buyer={buyer}
        lines={lines}
        subtotal={quote.subtotal}
        discount={quote.discount}
        tax={quote.tax}
        total={quote.total}
        notes={[quote.title, quote.notes].filter(Boolean).join("\n")}
      />
    </>
  );
}
