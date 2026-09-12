import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { Process } from "@/components/sections/Process";
import { Closing } from "@/components/sections/Closing";
import { Zone } from "@/components/system/Zone";
import { Shell } from "@/components/system/Shell";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: locale === "fa" ? "/company/about" : "/en/company/about" },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.about" });
  const body = t.raw("body") as string[];

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: "/" },
    { name: t("title"), url: "/company/about" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("lead")} />
      <Zone tone="light">
        <Shell className="grid gap-y-8 py-20 md:py-28 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7 lg:col-start-4">
            {body.map((paragraph, i) => (
              <p key={i} className="t-lead mb-7 text-ink-muted last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Shell>
      </Zone>
      <Process />
      <Closing />
    </>
  );
}
