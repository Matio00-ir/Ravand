import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { manrope, vazirmatn } from "@/lib/fonts";
import "../globals.css";

/**
 * Root layout: document, fonts, locale direction, i18n provider.
 * Chrome lives in the route-group layouts — (marketing) has the site
 * masthead and footer, (app) has the product shell.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ravand.example";

  return {
    metadataBase: new URL(base),
    title: {
      default: `${t("name")} — ${t("tagline")}`,
      template: `%s — RAVAND`,
    },
    description: t("description"),
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: { fa: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: "RAVAND",
      title: `${t("name")} — ${t("tagline")}`,
      description: t("description"),
      locale: locale === "fa" ? "fa_IR" : "en_US",
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("name")} — ${t("tagline")}`,
      description: t("description"),
    },
    icons: { icon: "/favicon.ico" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={`${manrope.variable} ${vazirmatn.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
