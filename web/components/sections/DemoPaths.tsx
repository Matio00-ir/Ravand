import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The three ways into RAVAND, side by side at the top of /demo, ordered
 * by commitment: a no-sign-up guided tour, a working private demo (the
 * builder below), and a live session with an expert.
 */
export async function DemoPaths({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "demoPaths" });

  const card = (featured = false) =>
    `group flex flex-col rounded-[var(--radius-md)] border bg-raised p-6 transition-colors duration-[var(--t-base)] hover:border-ink ${
      featured ? "border-ink" : "border-line"
    }`;
  const cta = "inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink";
  const arrow = (
    <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform duration-[var(--t-base)] group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4.5 2l4 4-4 4" strokeLinecap="square" />
    </svg>
  );

  return (
    <div className="mt-12">
      <p className="t-label text-ink-muted">{t("eyebrow")}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Link href="/dashboard" className={card()}>
          <span className="t-label text-ink-muted">{t("tour.label")}</span>
          <span className="t-h4 mt-3 text-ink">{t("tour.title")}</span>
          <span className="t-small mt-2 text-ink-muted">{t("tour.body")}</span>
          <span className={`${cta} mt-auto pt-6`}>
            {t("tour.cta")} {arrow}
          </span>
        </Link>
        <a href="#builder" className={card(true)}>
          <span className="t-label text-ink-muted">{t("working.label")}</span>
          <span className="t-h4 mt-3 text-ink">{t("working.title")}</span>
          <span className="t-small mt-2 text-ink-muted">{t("working.body")}</span>
          <span className={`${cta} mt-auto pt-6`}>
            {t("working.cta")} {arrow}
          </span>
        </a>
        <Link href="/demo/expert" className={card()}>
          <span className="t-label text-ink-muted">{t("expert.label")}</span>
          <span className="t-h4 mt-3 text-ink">{t("expert.title")}</span>
          <span className="t-small mt-2 text-ink-muted">{t("expert.body")}</span>
          <span className={`${cta} mt-auto pt-6`}>
            {t("expert.cta")} {arrow}
          </span>
        </Link>
      </div>
    </div>
  );
}
