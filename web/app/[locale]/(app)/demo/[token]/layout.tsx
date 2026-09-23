import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLeadByToken, isExpired, isBlocked, touchAccess } from "@/lib/demo-leads";

/**
 * Server-side gate for every /demo/[token]/* route: this is a private,
 * per-customer environment, not a public page, so authorization happens
 * here — once, for the whole subtree — rather than trusting the client.
 * The token itself is the only credential (see lib/demo-token.ts); a
 * request with no matching row, an expired row, or a disabled row never
 * reaches the page, and gets the same "not valid" shape regardless of
 * which of those three it was, so a guess can't distinguish "wrong
 * token" from "someone else's expired token" from "disabled account".
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DemoTokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const lead = await getLeadByToken(token);

  if (!lead || isBlocked(lead)) {
    return <InvalidScreen locale={locale} />;
  }

  if (isExpired(lead)) {
    return <ExpiredScreen locale={locale} />;
  }

  await touchAccess(lead.id);

  return <>{children}</>;
}

async function InvalidScreen({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "demoEnv.invalid" });
  return (
    <GateScreen>
      <h1 className="t-h2 text-offwhite">{t("title")}</h1>
      <p className="t-body mt-4 max-w-md text-ink-inverse-muted">{t("body")}</p>
      <Link href="/demo" className="btn btn--light mt-8">
        {t("cta")}
      </Link>
    </GateScreen>
  );
}

async function ExpiredScreen({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "demoEnv.expired" });
  return (
    <GateScreen>
      <span className="t-label text-steel">{t("eyebrow")}</span>
      <h1 className="t-h2 mt-4 text-offwhite">{t("title")}</h1>
      <p className="t-body mt-4 max-w-md text-ink-inverse-muted">{t("body")}</p>
      <Link href="/company/contact" className="btn btn--light mt-8">
        {t("cta")}
      </Link>
    </GateScreen>
  );
}

function GateScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-deep px-6 text-center">
      <div className="flex max-w-lg flex-col items-center">{children}</div>
    </div>
  );
}
