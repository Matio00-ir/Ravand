import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveContract } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { contractFields } from "@/lib/admin/defs";
import { addDaysIso, addYearsIso, todayIso } from "@/lib/admin/jalali";
import { customerOptions } from "@/lib/admin/settings";

export const metadata = { title: "قرارداد جدید" };

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ customer?: string; kind?: string }> }) {
  await requirePage("finance");
  const sp = await searchParams;
  const today = todayIso();
  const kind = sp.kind === "support" ? "support" : "implementation";
  return (
    <>
      <PageHeader title="قرارداد جدید" back={{ href: "/admin/contracts", label: "قراردادها" }} />
      <Section title="مشخصات قرارداد">
        <EntityForm
          action={saveContract}
          fields={contractFields(await customerOptions())}
          values={{
            customer_id: sp.customer ?? null,
            kind,
            status: "active",
            title: kind === "support" ? "پشتیبانی و به‌روزرسانی سالانه روند" : "پیاده‌سازی و راه‌اندازی روند",
            start_date: today,
            end_date: kind === "support" ? addDaysIso(addYearsIso(today, 1), -1) : null,
            auto_renew: kind === "support",
          }}
          submitLabel="ثبت قرارداد"
        />
      </Section>
    </>
  );
}
