import { A, Empty, PageHeader, Section } from "@/components/admin/ui";
import { can, requirePage } from "@/lib/admin/auth";
import { latinDigits } from "@/lib/admin/fields";
import { q } from "@/lib/admin/schema";

export const metadata = { title: "جستجو" };

type Hit = { href: string; title: string; sub: string | null };

/** One box across customers, deals, invoices, contracts, tickets and projects — only the areas this role may open. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePage("dashboard");
  const raw = ((await searchParams).q ?? "").trim().slice(0, 80);
  const term = latinDigits(raw);
  const groups: { title: string; hits: Hit[] }[] = [];

  if (term.length >= 2) {
    const like = `%${term}%`;
    const run = async (title: string, sql: string, make: (r: Record<string, unknown>) => Hit) => {
      const rows = await q<Record<string, unknown>>(sql, [like]);
      if (rows.length) groups.push({ title, hits: rows.map(make) });
    };
    if (can(user.role, "customers")) {
      await run(
        "مشتریان",
        `SELECT DISTINCT c.id, c.name, c.city FROM adm_customers c LEFT JOIN adm_contacts p ON p.customer_id = c.id
         WHERE c.name ILIKE $1 OR c.phone ILIKE $1 OR c.email ILIKE $1 OR c.national_id ILIKE $1 OR p.name ILIKE $1 OR p.mobile ILIKE $1 LIMIT 15`,
        (r) => ({ href: `/admin/customers/${r.id}`, title: String(r.name), sub: (r.city as string) ?? null })
      );
    }
    if (can(user.role, "crm")) {
      await run(
        "فرصت‌های فروش",
        `SELECT id, title, contact_name, mobile FROM adm_deals WHERE title ILIKE $1 OR company ILIKE $1 OR contact_name ILIKE $1 OR mobile ILIKE $1 OR email ILIKE $1 ORDER BY updated_at DESC LIMIT 15`,
        (r) => ({ href: `/admin/deals/${r.id}`, title: String(r.title), sub: [r.contact_name, r.mobile].filter(Boolean).join(" · ") || null })
      );
    }
    if (can(user.role, "finance")) {
      await run(
        "فاکتورها",
        `SELECT i.id, i.number, c.name FROM adm_invoices i JOIN adm_customers c ON c.id = i.customer_id WHERE i.number ILIKE $1 OR c.name ILIKE $1 ORDER BY i.issued_at DESC LIMIT 10`,
        (r) => ({ href: `/admin/invoices/${r.id}`, title: String(r.number), sub: String(r.name) })
      );
      await run(
        "قراردادها",
        `SELECT k.id, k.number, k.title, c.name FROM adm_contracts k JOIN adm_customers c ON c.id = k.customer_id WHERE k.number ILIKE $1 OR k.title ILIKE $1 OR c.name ILIKE $1 LIMIT 10`,
        (r) => ({ href: `/admin/contracts/${r.id}`, title: `${r.number} — ${r.title}`, sub: String(r.name) })
      );
    }
    if (can(user.role, "support")) {
      await run(
        "تیکت‌ها",
        `SELECT id, number, subject FROM adm_tickets WHERE number ILIKE $1 OR subject ILIKE $1 OR body ILIKE $1 ORDER BY created_at DESC LIMIT 10`,
        (r) => ({ href: `/admin/tickets/${r.id}`, title: `${r.number} — ${r.subject}`, sub: null })
      );
    }
    if (can(user.role, "projects")) {
      await run("پروژه‌ها", `SELECT id, title FROM adm_projects WHERE title ILIKE $1 LIMIT 10`, (r) => ({ href: `/admin/projects/${r.id}`, title: String(r.title), sub: null }));
    }
  }

  return (
    <>
      <PageHeader title={raw ? `نتایج «${raw}»` : "جستجو"} meta={term.length < 2 ? "حداقل دو حرف وارد کنید." : undefined} />
      {term.length >= 2 && groups.length === 0 ? <Empty>چیزی پیدا نشد.</Empty> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        {groups.map((g) => (
          <Section key={g.title} title={g.title}>
            <ul className="divide-y divide-line-dark">
              {g.hits.map((h) => (
                <li key={h.href} className="py-2.5">
                  <A href={h.href} className="text-[13.5px]">{h.title}</A>
                  {h.sub ? <p className="text-[12px] text-steel">{h.sub}</p> : null}
                </li>
              ))}
            </ul>
          </Section>
        ))}
      </div>
    </>
  );
}
