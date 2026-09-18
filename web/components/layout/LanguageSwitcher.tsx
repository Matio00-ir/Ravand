"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const labels: Record<string, string> = { fa: "فا", en: "EN" };

/**
 * The language switcher reuses the logo's divider device (RAVAND | روند)
 * rather than being a control widget: two labels, one rule between them.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <div
      className={cn("inline-flex items-center gap-2.5", className)}
      role="group"
      aria-label="Language / زبان"
    >
      {routing.locales.map((loc, i) => (
        <span key={loc} className="inline-flex items-center gap-2.5">
          {i > 0 ? (
            <span aria-hidden="true" className="h-3 w-px bg-hair-dark-strong" />
          ) : null}
          <button
            type="button"
            aria-current={loc === locale ? "true" : undefined}
            onClick={() => {
              if (loc !== locale) track("locale_switch", { to: loc });
              router.replace(
                // @ts-expect-error -- pathname is typed per-route; it is valid for both locales
                { pathname, params },
                { locale: loc }
              );
            }}
            className={cn(
              "t-label transition-colors duration-[var(--t-base)]",
              loc === locale ? "text-offwhite" : "text-steel hover:text-silver"
            )}
          >
            {labels[loc]}
          </button>
        </span>
      ))}
    </div>
  );
}
