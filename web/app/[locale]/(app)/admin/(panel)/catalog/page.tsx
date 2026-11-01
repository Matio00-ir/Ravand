import { ActionButton, EntityForm } from "@/components/admin/forms";
import { PageHeader, Section } from "@/components/admin/ui";
import { deleteCatalogItem, saveCatalogItem } from "@/lib/admin/actions/finance";
import { requirePage } from "@/lib/admin/auth";
import { catalogFields } from "@/lib/admin/defs";
import { valuesFor } from "@/lib/admin/fields";
import { CATALOG_KINDS, labelOf } from "@/lib/admin/labels";
import { listCatalog } from "@/lib/admin/settings";

export const metadata = { title: "خدمات و قیمت‌ها" };

/** RAVAND's price list — the quick-picks offered on quotes and invoices. */
export default async function CatalogPage() {
  await requirePage("finance");
  const items = await listCatalog();
  return (
    <>
      <PageHeader title="خدمات و قیمت‌ها" meta="فهرست قیمت پایه خدمات روند؛ در پیش‌فاکتور و فاکتور با یک کلیک اضافه می‌شوند و قابل تغییرند" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {items.map((it) => (
            <Section key={it.id} title={it.name} meta={`${labelOf(CATALOG_KINDS, it.kind)} · هر ${it.unit}${it.active ? "" : " · غیرفعال"}`}>
              <EntityForm action={saveCatalogItem} fields={catalogFields} values={valuesFor(catalogFields, it)} hidden={{ id: it.id }} />
              <div className="mt-3">
                <ActionButton action={deleteCatalogItem} hidden={{ id: it.id }} label="حذف خدمت" small variant="danger" confirm="این خدمت از فهرست حذف شود؟ (فاکتورهای قبلی تغییری نمی‌کنند)" />
              </div>
            </Section>
          ))}
        </div>
        <Section title="خدمت جدید">
          <EntityForm action={saveCatalogItem} fields={catalogFields} values={{ kind: "implementation", active: true }} submitLabel="افزودن" resetOnSuccess />
        </Section>
      </div>
    </>
  );
}
