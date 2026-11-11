import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Pains } from "@/components/sections/Pains";
import { Platform } from "@/components/sections/Platform";
import { ProductZone } from "@/components/sections/ProductZone";
import { WhatYouGet } from "@/components/sections/WhatYouGet";
import { Industries } from "@/components/sections/Industries";
import { Customers } from "@/components/sections/Customers";
import { Closing } from "@/components/sections/Closing";
import { softwareApplicationJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  // `absolute` so the root layout's "%s — RAVAND" template does not append
  // a second RAVAND to the home page title. The title names what the
  // product is (searchable) rather than the slogan.
  const brand = locale === "fa" ? t("nameFa") : t("name");
  return {
    title: { absolute: `${brand} | ${t("title")}` },
    description: t("description"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const site = await getTranslations({ locale, namespace: "site" });

  const jsonLd = softwareApplicationJsonLd({
    locale,
    name: "RAVAND Business Management System",
    description: site("description"),
    category: "BusinessApplication",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Story order: what it is → your problems → what solves them →
          see it working → is it for my industry → what I get → start.
          The process register lives on /company/about and /solutions. */}
      <Hero />
      <Pains />
      <Platform />
      <ProductZone />
      <Industries />
      {/* Hidden until lib/company.ts lists real customers. */}
      <Customers />
      <WhatYouGet />
      <Closing />
    </>
  );
}
