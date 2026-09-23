import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { SalesContent } from "@/components/dashboard/SalesContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dash.sales" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const s = await getTranslations({ locale, namespace: "dash.sales" });

  return (
    <DashboardShell title={s("title")} meta={s("meta")}>
      <SalesContent locale={locale} />
    </DashboardShell>
  );
}
