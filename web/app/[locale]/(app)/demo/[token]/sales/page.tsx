import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { SalesContent } from "@/components/dashboard/SalesContent";
import { getLeadByToken } from "@/lib/demo-leads";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenSalesPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);
  if (!lead) return null;

  const s = await getTranslations({ locale, namespace: "dash.sales" });

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={s("title")} meta={s("meta")}>
      <SalesContent locale={locale} />
    </DemoShell>
  );
}
