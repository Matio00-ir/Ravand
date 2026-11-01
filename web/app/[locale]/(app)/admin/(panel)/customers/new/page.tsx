import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveCustomer } from "@/lib/admin/actions/customers";
import { requirePage } from "@/lib/admin/auth";
import { customerFields } from "@/lib/admin/defs";

export const metadata = { title: "مشتری جدید" };

export default async function NewCustomerPage() {
  await requirePage("customers");
  return (
    <>
      <PageHeader title="مشتری جدید" back={{ href: "/admin/customers", label: "مشتریان" }} meta="مشتری‌هایی که از فرصت فروش می‌آیند با دکمه «تبدیل به مشتری» خودکار ساخته می‌شوند" />
      <Section title="مشخصات مشتری">
        <EntityForm action={saveCustomer} fields={customerFields} values={{ status: "active", source: "manual" }} submitLabel="ساخت پرونده" />
      </Section>
    </>
  );
}
