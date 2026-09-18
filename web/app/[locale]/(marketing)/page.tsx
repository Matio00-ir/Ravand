import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Platform } from "@/components/sections/Platform";
import { ProductZone } from "@/components/sections/ProductZone";
import { Testimonials } from "@/components/sections/Testimonials";
import { Industries } from "@/components/sections/Industries";
import { Process } from "@/components/sections/Process";
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
  // a second RAVAND to the home page title.
  return {
    title: { absolute: `${t("name")} — ${t("tagline")}` },
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

  const jsonLd = softwareApplicationJsonLd({
    locale,
    name: "RAVAND Business Management System",
    description:
      locale === "fa"
        ? "سیستم مدیریتی ماژولار روند."
        : "RAVAND modular business management system.",
    category: "BusinessApplication",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Platform />
      <ProductZone />
      <Testimonials />
      <Industries />
      <Process />
      <Closing />
    </>
  );
}
