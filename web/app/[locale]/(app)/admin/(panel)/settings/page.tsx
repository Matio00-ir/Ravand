import { Table, Td, Tr } from "@/components/dashboard/ui";
import { ActionButton, EntityForm } from "@/components/admin/forms";
import { PageHeader, Section, jdatetime } from "@/components/admin/ui";
import { addUser, changeOwnPassword, saveCompany, toggleUser } from "@/lib/admin/actions/system";
import { requirePage } from "@/lib/admin/auth";
import { companyFields, passwordFields, userFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { ROLE_LABELS, labelOf } from "@/lib/admin/labels";
import { q } from "@/lib/admin/schema";
import { getCompany } from "@/lib/admin/settings";

export const metadata = { title: "تنظیمات و کاربران" };

export default async function SettingsPage() {
  const me = await requirePage("settings");
  const [company, users] = await Promise.all([
    getCompany(),
    q<{ id: string; username: string; name: string; role: string; active: boolean; last_login_at: Date | null }>(
      `SELECT id, username, name, role, active, last_login_at FROM adm_users ORDER BY created_at`
    ),
  ]);

  return (
    <>
      <PageHeader title="تنظیمات و کاربران" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="مشخصات شرکت" meta="روی پیش‌فاکتورها و فاکتورهای رسمی چاپ می‌شود">
            <EntityForm action={saveCompany} fields={companyFields} values={valuesFor(companyFields, company)} />
          </Section>
          <Section title="کاربران پنل" meta="هر نفر با حساب و نقش خودش" flush>
            <Table head={[{ label: "کاربر" }, { label: "نقش" }, { label: "آخرین ورود", hideBelow: "md" }, { label: "" }]}>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <p className={u.active ? undefined : "text-steel line-through"}>{u.name}</p>
                    <p className="text-[12px] text-steel" dir="ltr">{u.username}</p>
                  </Td>
                  <Td muted>{labelOf(ROLE_LABELS, u.role)}</Td>
                  <Td muted hideBelow="md">{jdatetime(u.last_login_at)}</Td>
                  <Td align="end">
                    {u.id === me.id ? (
                      <span className="text-[12px] text-steel">شما</span>
                    ) : (
                      <ActionButton action={toggleUser} hidden={{ id: u.id }} label={u.active ? "غیرفعال" : "فعال‌سازی"} small variant={u.active ? "danger" : "ghost"} confirm={u.active ? `دسترسی ${u.name} قطع شود؟` : undefined} />
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          </Section>
        </div>
        <div className="min-w-0 space-y-6">
          <Section title="کاربر جدید" meta="نقش‌ها: فروش (فرصت‌ها، پیش‌فاکتور، مشتریان)، مالی (قرارداد، فاکتور، هزینه)، پشتیبانی (پروژه، تیکت)، مدیر (همه به‌جز تنظیمات)">
            <EntityForm action={addUser} fields={userFields} values={{ role: "sales" }} submitLabel="ساخت کاربر" resetOnSuccess />
          </Section>
          <Section title="تغییر رمز عبور من">
            <EntityForm action={changeOwnPassword} fields={passwordFields} submitLabel="تغییر رمز" resetOnSuccess />
          </Section>
        </div>
      </div>
    </>
  );
}
