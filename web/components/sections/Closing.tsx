import { useTranslations } from "next-intl";
import { Zone } from "@/components/system/Zone";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/ui/Logo";

/**
 * The close: one statement, one action. Calm, not a conversion band.
 */
export function Closing() {
  const t = useTranslations("closing");

  return (
    <Zone tone="deep" grid>
      <div className="shell zone text-center">
        <LogoMark tone="inverse" className="mx-auto h-9" />
        <h2 className="t-h2 mx-auto mt-10 max-w-2xl text-offwhite">{t("title")}</h2>
        <p className="t-lead mx-auto mt-6 max-w-xl text-ink-inverse-muted">
          {t("description")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/demo" className="btn btn--light">
            {t("ctaPrimary")}
          </Link>
          <Link href="/company/contact" className="btn btn--ghost-dark">
            {t("ctaSecondary")}
          </Link>
        </div>
        <p className="t-small mt-8 text-steel">{t("note")}</p>
      </div>
    </Zone>
  );
}
