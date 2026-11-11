import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTACT_LINKS } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * How pricing works, without a price. RAVAND never publishes numbers on
 * the site; it says the price follows the chosen modules and that the
 * estimate comes in a phone call. Silence about price reads as
 * "expensive", so the question is answered, just not with a figure.
 *
 * `action="contact"` links to the contact page (home page use);
 * `action="call"` dials directly (already on the contact page).
 */
export function PricingNote({
  action = "call",
  className,
}: {
  action?: "call" | "contact";
  className?: string;
}) {
  const t = useTranslations("pricing");
  const cta = "btn btn--sm btn--ghost-light mt-5";

  return (
    <div className={cn("border-t border-ink pt-6", className)}>
      <p className="t-label text-ink-muted">{t("label")}</p>
      <h2 className="t-h4 mt-3 text-ink">{t("title")}</h2>
      <p className="t-body mt-2 text-ink-muted">{t("body")}</p>
      {action === "call" ? (
        <a href={CONTACT_LINKS.tel} className={cta}>
          {t("cta")}
        </a>
      ) : (
        <Link href="/company/contact" className={cta}>
          {t("cta")}
        </Link>
      )}
    </div>
  );
}
