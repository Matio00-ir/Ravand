import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { RavandBuilder } from "@/components/sections/RavandBuilder";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.demo" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "fa" ? "/demo" : "/en/demo" },
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.demo" });

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: "/" },
    { name: t("title"), url: "/demo" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <RavandBuilder />
    </>
  );
}
