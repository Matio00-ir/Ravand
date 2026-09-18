import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { IndustryDetail } from "@/components/sections/IndustryDetail";
import { Closing } from "@/components/sections/Closing";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPathname } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/metadata";

const ID = "healthcare";
const HREF = "/industries/healthcare" as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "industries" });
  const items = t.raw("items") as { id: string; name: string; description: string }[];
  const industry = items.find((i) => i.id === ID)!;
  return {
    title: industry.name,
    description: industry.description,
    alternates: localizedAlternates(HREF, locale),
  };
}

export default async function HealthcareIndustryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "industries" });
  const tp = await getTranslations({ locale, namespace: "pages.industries" });
  const items = t.raw("items") as { id: string; name: string; description: string }[];
  const industry = items.find((i) => i.id === ID)!;

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: getPathname({ href: "/", locale }) },
    { name: tp("title"), url: getPathname({ href: "/industries", locale }) },
    { name: industry.name, url: getPathname({ href: HREF, locale }) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={tp("eyebrow")} title={industry.name} description={industry.description} />
      <IndustryDetail id={ID} />
      <Closing />
    </>
  );
}
