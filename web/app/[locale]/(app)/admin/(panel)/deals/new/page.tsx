import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveDeal } from "@/lib/admin/actions/crm";
import { requirePage } from "@/lib/admin/auth";
import { dealFields } from "@/lib/admin/defs";
import { userOptions } from "@/lib/admin/settings";

export const metadata = { title: "فرصت جدید" };

export default async function NewDealPage() {
  const user = await requirePage("crm");
  return (
    <>
      <PageHeader title="فرصت فروش جدید" back={{ href: "/admin/deals", label: "فرصت‌های فروش" }} />
      <Section title="مشخصات فرصت">
        <EntityForm
          action={saveDeal}
          fields={dealFields(await userOptions())}
          values={{ source: "phone", stage: "new", owner_id: user.id }}
          submitLabel="ثبت فرصت"
        />
      </Section>
    </>
  );
}
