import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveTicket } from "@/lib/admin/actions/ops";
import { requirePage } from "@/lib/admin/auth";
import { ticketFields } from "@/lib/admin/defs";
import { customerOptions, userOptions } from "@/lib/admin/settings";

export const metadata = { title: "تیکت جدید" };

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const user = await requirePage("support");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="تیکت جدید" back={{ href: "/admin/tickets", label: "تیکت‌ها" }} meta="مهلت حل: فوری ۴ ساعت، زیاد ۱ روز، عادی ۳ روز، کم ۷ روز" />
      <Section title="مشخصات تیکت">
        <EntityForm
          action={saveTicket}
          fields={ticketFields(await customerOptions(), await userOptions())}
          values={{ customer_id: sp.customer ?? null, priority: "normal", category: "question", channel: "phone", assignee_id: user.id }}
          submitLabel="ثبت تیکت"
        />
      </Section>
    </>
  );
}
