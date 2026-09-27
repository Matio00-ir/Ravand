import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoShell } from "@/components/dashboard/DemoShell";
import { FinanceContent } from "@/components/dashboard/FinanceContent";
import { getLeadByToken } from "@/lib/demo-leads";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenFinancePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);
  if (!lead) return null;

  const f = await getTranslations({ locale, namespace: "dash.finance" });

  return (
    <DemoShell lead={lead} token={token} locale={locale} title={f("title")} meta={f("meta")}>
      <FinanceContent locale={locale} />
    </DemoShell>
  );
}
