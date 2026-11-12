import { useLocale, useTranslations } from "next-intl";
import { Link, getPathname } from "@/i18n/navigation";
import type { Pathname } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ContactDetails } from "@/components/sections/ContactDetails";
import { Enamad } from "@/components/system/Enamad";

/**
 * One destination per footer item, in the same order as the item labels
 * in messages (footer.columns.*.items). `hash` jumps to that module card
 * or tier on the page, so six product links don't all land on the same
 * spot. Keep the two lists the same length — a missing entry used to
 * fall back to the home page silently.
 */
type FooterLink = { href: Pathname; hash?: string };

const columnLinks: Record<string, readonly FooterLink[]> = {
  products: [
    { href: "/products", hash: "module-erp" },
    { href: "/products", hash: "module-finance" },
    { href: "/products", hash: "module-crm" },
    { href: "/products", hash: "module-sales" },
    { href: "/products", hash: "module-inventory" },
    { href: "/products", hash: "module-workflow" },
  ],
  solutions: [
    { href: "/solutions", hash: "tier-1" },
    { href: "/solutions", hash: "tier-2" },
    { href: "/solutions", hash: "tier-3" },
  ],
  industries: [
    { href: "/industries/manufacturing" },
    { href: "/industries/trading" },
    { href: "/industries/retail" },
    { href: "/industries/services" },
    { href: "/industries/fitness" },
    { href: "/industries/healthcare" },
  ],
  company: [
    { href: "/company/about" },
    { href: "/company/contact" },
    { href: "/demo" },
    { href: "/dashboard" },
  ],
};

const linkClass =
  "text-[13px] text-ink-inverse-muted transition-colors duration-[var(--t-base)] hover:text-offwhite";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  // fa-IR formats in the Solar Hijri calendar with Persian digits (۱۴۰۵).
  const year = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
  }).format(new Date());
  const columns = ["products", "solutions", "industries", "company"] as const;

  return (
    <footer className="border-t border-line-dark bg-deep text-ink-inverse">
      <div className="shell grid gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="inverse" bilingual />
          <p className="t-body mt-6 max-w-xs text-ink-inverse-muted">
            {t("description")}
          </p>
          <ContactDetails variant="compact" />
          <Enamad className="mt-6" />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-7 lg:col-start-6">
          {columns.map((col) => {
            const data = t.raw(`columns.${col}`) as { title: string; items: string[] };
            const hrefs = columnLinks[col];
            return (
              <div key={col}>
                <h3 className="t-label text-offwhite">{data.title}</h3>
                <ul className="mt-5 space-y-3">
                  {data.items.map((item, i) => {
                    const link = hrefs[i];
                    if (!link) return null;
                    return (
                      <li key={item}>
                        {link.hash ? (
                          // next-intl's Link has no hash option, so build the
                          // localized path and append the anchor ourselves.
                          <a
                            href={`${getPathname({ href: link.href, locale })}#${link.hash}`}
                            className={linkClass}
                          >
                            {item}
                          </a>
                        ) : (
                          <Link href={link.href as never} className={linkClass}>
                            {item}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line-dark">
        <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="t-small text-steel">
            © {year} {locale === "fa" ? "روند" : "RAVAND"} · {t("rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="t-small text-steel hover:text-silver">
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" className="t-small text-steel hover:text-silver">
              {t("legal.terms")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
