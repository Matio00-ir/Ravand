import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { Zone } from "@/components/system/Zone";
import { Shell } from "@/components/system/Shell";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "fa" ? "/company/contact" : "/en/company/contact" },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.contact" });

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: "/" },
    { name: t("title"), url: "/company/contact" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Zone tone="light">
        <Shell className="grid py-20 md:py-24 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7 lg:col-start-4">
            <ContactForm />
          </div>
        </Shell>
      </Zone>
    </>
  );
}
