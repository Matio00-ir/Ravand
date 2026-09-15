import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { Zone } from "@/components/system/Zone";
import { Shell } from "@/components/system/Shell";
import { Reveal } from "@/components/system/Reveal";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPathname } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: localizedAlternates("/terms", locale),
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  const sections = t.raw("sections") as { title: string; body: string }[];

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: getPathname({ href: "/", locale }) },
    { name: t("title"), url: getPathname({ href: "/terms", locale }) },
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
            <p className="t-small mb-10 text-ink-muted">{t("updated")}</p>
            <p className="t-body mb-10 border-s-2 border-line-strong ps-4 text-ink-muted">
              {t("disclaimer")}
            </p>
            <Reveal>
              <dl className="divide-y divide-line border-y border-line">
                {sections.map((section) => (
                  <div key={section.title} className="py-6 first:pt-0 last:pb-0">
                    <dt className="t-h4 text-ink">{section.title}</dt>
                    <dd className="t-body mt-2.5 text-ink-muted">{section.body}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </Shell>
      </Zone>
    </>
  );
}
