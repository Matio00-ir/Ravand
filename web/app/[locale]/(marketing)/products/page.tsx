import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { Platform } from "@/components/sections/Platform";
import { ProductZone } from "@/components/sections/ProductZone";
import { Closing } from "@/components/sections/Closing";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPathname } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.products" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/products", locale),
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.products" });

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: getPathname({ href: "/", locale }) },
    { name: t("title"), url: getPathname({ href: "/products", locale }) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Platform />
      <ProductZone />
      <Closing />
    </>
  );
}
