import { useLocale, useTranslations } from "next-intl";
import { CONTACT, CONTACT_LINKS, pick, telegramLink } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * Direct contact: phone (call), WhatsApp, Telegram, hours and city, all
 * from lib/company.ts. `panel` is the full block for the contact page;
 * `compact` is the short version for the dark footer.
 *
 * The phone number is wrapped in dir="ltr" so its digit groups keep their
 * order inside right-to-left text.
 */
export function ContactDetails({ variant = "panel" }: { variant?: "panel" | "compact" }) {
  const t = useTranslations("contactInfo");
  const locale = useLocale();
  const phone = pick(CONTACT.phoneDisplay, locale);
  const external = { target: "_blank", rel: "noopener noreferrer" } as const;

  if (variant === "compact") {
    const link = "transition-colors duration-[var(--t-base)] hover:text-offwhite";
    return (
      <div className="t-small mt-6 space-y-2 text-ink-inverse-muted">
        <p>
          <a href={CONTACT_LINKS.tel} className={cn("t-num text-offwhite", link)}>
            <span dir="ltr">{phone}</span>
          </a>
        </p>
        <p className="flex gap-4">
          <a href={CONTACT_LINKS.whatsapp} className={link} {...external}>
            {t("whatsapp")}
          </a>
          <a href={telegramLink()} className={link} {...external}>
            {t("telegram")}
          </a>
        </p>
        <p>{pick(CONTACT.hours, locale)}</p>
        <p>{pick(CONTACT.address, locale)}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-ink pt-6">
      <h2 className="t-h4 text-ink">{t("title")}</h2>
      <p className="t-body mt-2 text-ink-muted">{t("lead")}</p>

      <a
        href={CONTACT_LINKS.tel}
        className="t-num mt-6 block text-[1.6rem] font-bold leading-none text-ink hover:underline"
      >
        <span dir="ltr">{phone}</span>
      </a>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={CONTACT_LINKS.tel} className="btn btn--sm btn--dark">
          {t("call")}
        </a>
        <a href={CONTACT_LINKS.whatsapp} className="btn btn--sm btn--ghost-light" {...external}>
          {t("whatsapp")}
        </a>
        <a href={telegramLink()} className="btn btn--sm btn--ghost-light" {...external}>
          {t("telegram")}
        </a>
      </div>

      <dl className="mt-7 space-y-4 border-t border-line pt-5">
        <div>
          <dt className="t-label text-ink-muted">{t("hours")}</dt>
          <dd className="t-body mt-1 text-ink">{pick(CONTACT.hours, locale)}</dd>
        </div>
        <div>
          <dt className="t-label text-ink-muted">{t("address")}</dt>
          <dd className="t-body mt-1 text-ink">{pick(CONTACT.address, locale)}</dd>
        </div>
      </dl>
    </div>
  );
}
