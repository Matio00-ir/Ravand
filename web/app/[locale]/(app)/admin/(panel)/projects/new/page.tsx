import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveProject } from "@/lib/admin/actions/ops";
import { requirePage } from "@/lib/admin/auth";
import { projectFields } from "@/lib/admin/defs";
import { addDaysIso, todayIso } from "@/lib/admin/jalali";
import { DEFAULT_PHASES } from "@/lib/admin/labels";
import { contractOptions, customerOptions, userOptions } from "@/lib/admin/settings";

export const metadata = { title: "پروژه جدید" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ customer?: string; contract?: string }> }) {
  const user = await requirePage("projects");
  const sp = await searchParams;
  const [customers, contracts, users] = await Promise.all([customerOptions(), contractOptions(), userOptions()]);
  const customer = customers.find((c) => c.value === sp.customer);
  return (
    <>
      <PageHeader title="پروژه پیاده‌سازی جدید" back={{ href: "/admin/projects", label: "پروژه‌ها" }} meta={`مراحل پیش‌فرض: ${DEFAULT_PHASES.join("، ")}`} />
      <Section title="مشخصات پروژه">
        <EntityForm
          action={saveProject}
          fields={projectFields(customers, contracts, users)}
          values={{
            title: customer ? `پیاده‌سازی روند — ${customer.label}` : null,
            customer_id: sp.customer ?? null,
            contract_id: sp.contract ?? null,
            status: "planning",
            manager_id: user.id,
            start_date: todayIso(),
            due_date: addDaysIso(todayIso(), 45),
          }}
          submitLabel="ساخت پروژه"
        />
      </Section>
    </>
  );
}
