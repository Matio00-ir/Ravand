import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell, type NavGroup } from "@/components/admin/AdminShell";
import { can, currentUser, type Area } from "@/lib/admin/auth";
import { logoutAction } from "@/lib/admin/actions/auth";
import { syncInbound } from "@/lib/admin/crm";
import { labelOf, ROLE_LABELS } from "@/lib/admin/labels";
import { q1 } from "@/lib/admin/schema";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت روند", template: "%s — پنل روند" },
  robots: { index: false, follow: false, nocache: true },
};

type Item = { href: string; label: string; area: Area; badge?: number };

/**
 * Gate + chrome for every /admin page. Each page also checks its own
 * area (requirePage), so a role without access can't reach a page by URL
 * even though the rail already hides it.
 */
export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "fa") redirect("/admin");
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  await syncInbound();
  const counts = await q1<{ inbox: number; leads: number; tasks: number; overdue: number; tickets: number; renewals: number }>(
    `SELECT
       (SELECT count(*)::int FROM contact_messages WHERE status = 'new') AS inbox,
       (SELECT count(*)::int FROM adm_deals WHERE stage = 'new' OR (source IN ('demo', 'expert') AND stage = 'demo' AND updated_at = created_at)) AS leads,
       (SELECT count(*)::int FROM adm_tasks WHERE NOT done AND due_date <= (now() AT TIME ZONE 'Asia/Tehran')::date) AS tasks,
       (SELECT count(*)::int FROM adm_invoices WHERE status IN ('issued', 'partial') AND due_at < (now() AT TIME ZONE 'Asia/Tehran')::date) AS overdue,
       (SELECT count(*)::int FROM adm_tickets WHERE status IN ('open', 'in_progress', 'waiting')) AS tickets,
       (SELECT count(*)::int FROM adm_contracts WHERE status = 'active' AND kind = 'support'
          AND end_date <= (now() AT TIME ZONE 'Asia/Tehran')::date + 45
          AND NOT EXISTS (SELECT 1 FROM adm_contracts n WHERE n.renewal_of = adm_contracts.id)) AS renewals`
  );

  const groups: { label: string; items: Item[] }[] = [
    { label: "", items: [{ href: "/admin", label: "داشبورد", area: "dashboard" }] },
    {
      label: "فروش",
      items: [
        { href: "/admin/deals", label: "فرصت‌های فروش", area: "crm", badge: counts?.leads },
        { href: "/admin/tasks", label: "کارها و پیگیری‌ها", area: "dashboard", badge: counts?.tasks },
        { href: "/admin/quotes", label: "پیش‌فاکتورها", area: "crm" },
        { href: "/admin/demos", label: "دموهای سایت", area: "crm" },
        { href: "/admin/inbox", label: "پیام‌های سایت", area: "crm", badge: counts?.inbox },
      ],
    },
    {
      label: "مشتریان",
      items: [
        { href: "/admin/customers", label: "مشتریان", area: "customers" },
        { href: "/admin/contracts", label: "قراردادها و تمدید", area: "finance", badge: counts?.renewals },
      ],
    },
    {
      label: "مالی",
      items: [
        { href: "/admin/invoices", label: "فاکتورها و دریافت‌ها", area: "finance", badge: counts?.overdue },
        { href: "/admin/expenses", label: "هزینه‌ها", area: "finance" },
        { href: "/admin/finance", label: "گزارش مالی", area: "finance" },
        { href: "/admin/catalog", label: "خدمات و قیمت‌ها", area: "finance" },
      ],
    },
    {
      label: "اجرا و پشتیبانی",
      items: [
        { href: "/admin/projects", label: "پروژه‌های پیاده‌سازی", area: "projects" },
        { href: "/admin/tickets", label: "تیکت‌های پشتیبانی", area: "support", badge: counts?.tickets },
      ],
    },
    {
      label: "بازاریابی و سایت",
      items: [
        { href: "/admin/marketing", label: "کمپین‌ها و منابع لید", area: "marketing" },
        { href: "/admin/site", label: "اعلان سایت", area: "marketing" },
      ],
    },
    { label: "سیستم", items: [{ href: "/admin/settings", label: "تنظیمات و کاربران", area: "settings" }] },
  ];

  const nav: NavGroup[] = groups
    .map((g) => ({
      label: g.label,
      items: g.items.filter((i) => can(user.role, i.area)).map(({ href, label, badge }) => ({ href, label, badge: badge || undefined })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <AdminShell nav={nav} userName={user.name} roleLabel={labelOf(ROLE_LABELS, user.role)} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
