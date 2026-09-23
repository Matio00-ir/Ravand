import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { FinanceContent } from "@/components/dashboard/FinanceContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dash.finance" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function FinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const f = await getTranslations({ locale, namespace: "dash.finance" });

  return (
    <DashboardShell title={f("title")} meta={f("meta")}>
      <FinanceContent locale={locale} />
    </DashboardShell>
  );
}
