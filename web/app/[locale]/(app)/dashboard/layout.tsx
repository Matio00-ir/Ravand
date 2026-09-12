import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

/**
 * The product area is an application surface, not a public page: it is
 * excluded from the sitemap and marked noindex here as well as in
 * robots.txt.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <>{children}</>;
}
