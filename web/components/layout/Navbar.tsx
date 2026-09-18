"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const links = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/solutions", key: "solutions" },
  { href: "/industries", key: "industries" },
  { href: "/company/about", key: "company" },
] as const;

/**
 * A permanent dark masthead: one fixed brand frame across every page,
 * so the logo always sits on its approved dark treatment and there is no
 * seam where a light bar meets the dark hero.
 */
export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line-dark bg-deep/95 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
          <Logo tone="inverse" bilingual />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.key}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-[13.5px] font-medium transition-colors duration-[var(--t-base)]",
                  isActive ? "text-offwhite" : "text-silver hover:text-offwhite"
                )}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/dashboard"
            onClick={() => track("cta_click", { cta: "demo_env" })}
            className="text-[13.5px] font-medium text-silver transition-colors duration-[var(--t-base)] hover:text-offwhite"
          >
            {t("demoEnv")}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/demo"
            onClick={() => track("demo_open", { cta: "nav" })}
            className="btn btn--sm btn--light"
          >
            {t("demo")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("close") : t("menu")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-xs)] border border-line-dark-strong text-silver lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {open ? (
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-line-dark bg-deep transition-[max-height] duration-[var(--t-slow)] ease-[var(--ease-flow)] lg:hidden",
          open ? "max-h-[26rem]" : "max-h-0 border-t-0"
        )}
      >
        <nav className="shell flex flex-col py-2" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-line-dark py-4 text-[15px] text-silver"
            >
              {t(link.key)}
            </Link>
          ))}
          <Link
            href="/dashboard"
            onClick={() => {
              setOpen(false);
              track("cta_click", { cta: "demo_env" });
            }}
            className="border-b border-line-dark py-4 text-[15px] text-silver"
          >
            {t("demoEnv")}
          </Link>
          <div className="flex items-center justify-between gap-4 py-5">
            <LanguageSwitcher />
            <Link
              href="/demo"
              onClick={() => {
                setOpen(false);
                track("demo_open", { cta: "nav_mobile" });
              }}
              className="btn btn--sm btn--light"
            >
              {t("demo")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
