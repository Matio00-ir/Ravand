import { useTranslations } from "next-intl";
import { Zone } from "@/components/system/Zone";
import { Dashboard } from "@/components/product/Dashboard";
import { Link } from "@/i18n/navigation";
import { WordmarkFa } from "@/components/ui/Logo";

/**
 * One statement, one action, and the product — complete and legible,
 * sitting on an even background grid. No cropping, no floating cards,
 * nothing that has to be scrolled to make sense.
 */
export function Hero() {
  const t = useTranslations("hero");

  return (
    <Zone tone="deep" grid className="overflow-hidden">
      <div className="shell pt-20 pb-20 md:pt-28 md:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-3">
              <span className="t-label text-steel">{t("eyebrow")}</span>
              <span aria-hidden="true" className="h-3.5 w-px bg-line-dark-strong" />
              <WordmarkFa tone="inverse" className="h-3 opacity-60" />
            </span>

            <h1 className="t-display mt-8 max-w-[15ch] text-offwhite">
              {t("title")}
            </h1>

            <p className="t-lead mt-7 max-w-lg text-ink-inverse-muted">
              {t("description")}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/demo" className="btn btn--light">
                {t("ctaPrimary")}
              </Link>
              <Link href="/dashboard" className="btn btn--ghost-dark">
                {t("ctaSecondary")}
              </Link>
            </div>

            <p className="t-small mt-6 text-steel">{t("note")}</p>
          </div>

          {/* The product — complete, inside its column. */}
          <div className="min-w-0">
            <Dashboard compact />
          </div>
        </div>
      </div>
    </Zone>
  );
}
