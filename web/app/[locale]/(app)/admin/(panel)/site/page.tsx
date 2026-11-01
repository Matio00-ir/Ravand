import { EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { saveAnnouncement } from "@/lib/admin/actions/system";
import { requirePage } from "@/lib/admin/auth";
import { announcementFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { getSetting, type Announcement } from "@/lib/admin/settings";

export const metadata = { title: "اعلان سایت" };

/** The one-line announcement shown above the website's masthead. */
export default async function SitePage() {
  await requirePage("marketing");
  const a = await getSetting<Announcement>("announcement", {});
  return (
    <>
      <PageHeader title="اعلان سایت" meta="یک پیام کوتاه بالای همه صفحه‌های سایت — برای تخفیف، رویداد، نسخه جدید یا اطلاعیه" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="متن و لینک">
          <EntityForm action={saveAnnouncement} fields={announcementFields} values={valuesFor(announcementFields, a)} submitLabel="ذخیره و انتشار" />
        </Section>
        <Section title="پیش‌نمایش">
          {a.active && a.text ? (
            <div className="rounded-[var(--radius-sm)] bg-black px-4 py-2 text-center text-[13px] text-offwhite">
              {a.text}
              {a.link_url ? <span className="ms-3 font-semibold underline underline-offset-4">{a.link_label || "بیشتر"}</span> : null}
            </div>
          ) : (
            <p className="text-[13px] text-steel">اعلانی نمایش داده نمی‌شود.</p>
          )}
          <p className="mt-4 text-[12px] text-steel">تغییرات حداکثر یک دقیقه بعد در سایت دیده می‌شوند.</p>
        </Section>
      </div>
    </>
  );
}
