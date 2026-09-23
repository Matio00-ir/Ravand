import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const columnLinks: Record<string, readonly string[]> = {
  products: ["/products", "/products", "/products", "/products", "/products", "/products"],
  solutions: ["/solutions", "/solutions", "/solutions"],
  industries: [
    "/industries/manufacturing",
    "/industries/trading",
    "/industries/retail",
    "/industries/services",
    "/industries/fitness",
    "/industries/healthcare",
  ],
  company: ["/company/about", "/company/contact", "/demo"],
};

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  const columns = ["products", "solutions", "industries", "company"] as const;

  return (
    <footer className="border-t border-line-dark bg-deep text-ink-inverse">
      <div className="shell grid gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="inverse" bilingual />
          <p className="t-body mt-6 max-w-xs text-ink-inverse-muted">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-7 lg:col-start-6">
          {columns.map((col) => {
            const data = t.raw(`columns.${col}`) as { title: string; items: string[] };
            const hrefs = columnLinks[col];
            return (
              <div key={col}>
                <h3 className="t-label text-offwhite">{data.title}</h3>
                <ul className="mt-5 space-y-3">
                  {data.items.map((item, i) => (
                    <li key={item}>
                      <Link
                        href={(hrefs[i] ?? "/") as never}
                        className="text-[13px] text-ink-inverse-muted transition-colors duration-[var(--t-base)] hover:text-offwhite"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line-dark">
        <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="t-small text-steel">
            © {year} RAVAND · {t("rights")}
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
