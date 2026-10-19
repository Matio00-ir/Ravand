import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { Panel } from "@/components/dashboard/ui";
import { InvoiceForm } from "@/components/sandbox/InvoiceForm";
import { RowLink, demoHref } from "@/components/sandbox/views";
import { loadDemo } from "@/lib/sandbox/context";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenNewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ customer?: string }>;
}) {
  const { locale, token } = await params;
  const { customer } = await searchParams;
  setRequestLocale(locale);

  const demo = await loadDemo(token, locale);
  if (!demo) return null;
  const { lead, snapshot } = demo;

  const v = await getTranslations({ locale, namespace: "sandbox.invoices" });
  const preselected = snapshot.customers.find((c) => String(c.id) === customer)?.id;

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={v("form.title")} meta={v("form.meta")}>
      <div className="min-w-0 space-y-4">
        <RowLink href={demoHref(locale, token, "/sales")} className="t-small text-silver">
          {v("backToList")}
        </RowLink>
        <Panel>
          <InvoiceForm
            token={token}
            defaultCustomerId={preselected}
            customers={snapshot.customers.map((c) => ({ id: c.id, name: c.name }))}
            products={snapshot.products.map((p) => ({
              id: p.id,
              name: p.name,
              unit: p.unit,
              price: p.price,
              stock: p.stock,
              trackStock: p.trackStock,
            }))}
          />
        </Panel>
      </div>
    </DemoShell>
  );
}
