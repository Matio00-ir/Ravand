import { EntityForm } from "@/components/admin/forms";
import { Facts, PageHeader, Section } from "@/components/admin/ui";
import { changeOwnPassword } from "@/lib/admin/actions/system";
import { requirePage } from "@/lib/admin/auth";
import { passwordFields } from "@/lib/admin/defs";
import { ROLE_LABELS, labelOf } from "@/lib/admin/labels";

export const metadata = { title: "حساب من" };

export default async function AccountPage() {
  const user = await requirePage("dashboard");
  return (
    <>
      <PageHeader title="حساب من" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="مشخصات">
          <Facts items={[["نام", user.name], ["نام کاربری", <span key="u" dir="ltr">{user.username}</span>], ["نقش", labelOf(ROLE_LABELS, user.role)]]} />
        </Section>
        <Section title="تغییر رمز عبور">
          <EntityForm action={changeOwnPassword} fields={passwordFields} submitLabel="تغییر رمز" resetOnSuccess />
        </Section>
      </div>
    </>
  );
}
