import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/Shell";
import { OverviewContent } from "@/components/dashboard/OverviewContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dash.overview" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const o = await getTranslations({ locale, namespace: "dash.overview" });

  return (
    <DashboardShell title={o("title")} meta={o("meta")}>
      <OverviewContent locale={locale} />
    </DashboardShell>
  );
}
