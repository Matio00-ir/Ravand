import { Panel } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/admin/forms";
import { A, Badge, Empty, PageHeader, Tabs, jdatetime } from "@/components/admin/ui";
import { updateMessage } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { listMessages } from "@/lib/admin/crm";
import { MESSAGE_STATUSES } from "@/lib/admin/labels";

export const metadata = { title: "پیام‌های سایت" };

/** Messages from the website's contact form. A sales enquiry becomes a deal with one click. */
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requirePage("crm");
  const { s } = await searchParams;
  const status = s === "archived" ? "archived" : s === "all" ? "all" : "inbox";
  const all = await listMessages();
  const shown = all.filter((m) => (status === "all" ? true : status === "archived" ? m.status === "archived" : m.status !== "archived"));

  return (
    <>
      <PageHeader title="پیام‌های سایت" meta="پیام‌های فرم «تماس با ما»" />
      <Panel flush>
        <div className="p-5">
          <Tabs
            items={[
              { href: "/admin/inbox", label: "صندوق", count: all.filter((m) => m.status !== "archived").length, active: status === "inbox" },
              { href: "/admin/inbox?s=archived", label: "بایگانی", count: all.filter((m) => m.status === "archived").length, active: status === "archived" },
              { href: "/admin/inbox?s=all", label: "همه", active: status === "all" },
            ]}
          />
        </div>
        <ul className="border-t border-line-dark">
          {shown.length === 0 ? (
            <li>
              <Empty>پیامی نیست.</Empty>
            </li>
          ) : null}
          {shown.map((m) => (
            <li key={m.id} className="border-b border-line-dark px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-offwhite">
                    {m.name}
                    {m.company ? <span className="font-normal text-silver"> · {m.company}</span> : null}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-steel">
                    <a href={`mailto:${m.email}`} className="hover:text-silver" dir="ltr">{m.email}</a>
                    {m.phone ? <a href={`tel:${m.phone}`} className="hover:text-silver" dir="ltr">{m.phone}</a> : null}
                    <span>{jdatetime(m.created_at)}</span>
                    <Badge map={MESSAGE_STATUSES} value={m.status} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {m.deal_id ? (
                    <A href={`/admin/deals/${m.deal_id}`} className="text-[12.5px]">فرصت فروش ←</A>
                  ) : (
                    <ActionButton action={updateMessage} hidden={{ id: m.id, op: "deal" }} label="تبدیل به فرصت فروش" small variant="primary" />
                  )}
                  {m.status === "new" ? <ActionButton action={updateMessage} hidden={{ id: m.id, op: "read" }} label="خوانده شد" small /> : null}
                  {m.status !== "archived" ? (
                    <ActionButton action={updateMessage} hidden={{ id: m.id, op: "archived" }} label="بایگانی" small />
                  ) : (
                    <ActionButton action={updateMessage} hidden={{ id: m.id, op: "read" }} label="بازگردانی" small />
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-silver">{m.message}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
