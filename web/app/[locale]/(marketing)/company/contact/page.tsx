import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactDetails } from "@/components/sections/ContactDetails";
import { PricingNote } from "@/components/sections/PricingNote";
import { Zone } from "@/components/system/Zone";
import { Shell } from "@/components/system/Shell";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPathname } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/metadata";

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
    alternates: localizedAlternates("/company/contact", locale),
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
    { name: "RAVAND", url: getPathname({ href: "/", locale }) },
    { name: t("title"), url: getPathname({ href: "/company/contact", locale }) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Zone tone="light">
        {/* Form and direct contact side by side: some buyers write, many
            Iranian SMB owners would rather call or message right away. */}
        {/* On mobile, direct contact comes FIRST (one tap to call beats a
            long form on a phone), then the form, then pricing. On desktop
            the form is on one side, contact and pricing on the other. */}
        <Shell className="grid gap-y-14 py-20 md:py-24 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7 lg:row-span-2 lg:row-start-1">
            <ContactForm />
          </div>
          <aside className="order-first lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start">
            <ContactDetails />
          </aside>
          <PricingNote className="lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:self-start" />
        </Shell>
      </Zone>
    </>
  );
}
