import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
import { ExpertRequestForm } from "@/components/sections/ExpertRequestForm";
import { Zone } from "@/components/system/Zone";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getPathname } from "@/i18n/navigation";
import { localizedAlternates } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "expert" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/demo/expert", locale),
  };
}

/** Layer 3: book a live, tailored demo with a RAVAND expert. */
export default async function ExpertDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "expert" });
  const demo = await getTranslations({ locale, namespace: "pages.demo" });

  const jsonLd = breadcrumbJsonLd([
    { name: "RAVAND", url: getPathname({ href: "/", locale }) },
    { name: demo("title"), url: getPathname({ href: "/demo", locale }) },
    { name: t("title"), url: getPathname({ href: "/demo/expert", locale }) },
  ]);

  const points = t.raw("points") as { title: string; body: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <Zone tone="light">
        <div className="shell zone grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <aside>
            <h2 className="t-h4 text-ink">{t("pointsTitle")}</h2>
            <ol className="mt-6 space-y-6">
              {points.map((p, i) => (
                <li key={p.title} className="flex gap-4">
                  <span className="t-num grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong text-[12px] text-ink-muted">
                    {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(i + 1)}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{p.title}</p>
                    <p className="t-small mt-1 text-ink-muted">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
          <ExpertRequestForm />
        </div>
      </Zone>
    </>
  );
}
