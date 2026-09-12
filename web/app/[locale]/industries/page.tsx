import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { Industries } from "@/components/sections/Industries";
import { ProductZone } from "@/components/sections/ProductZone";
import { Closing } from "@/components/sections/Closing";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.industries" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "fa" ? "/industries" : "/en/industries" },
  };
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.industries" });

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: "/" },
    { name: t("title"), url: "/industries" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Industries />
      <ProductZone />
      <Closing />
    </>
  );
}
