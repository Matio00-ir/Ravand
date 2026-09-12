"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { ModuleIcon, type ModuleKey } from "@/components/system/ModuleIcon";
import type { Pathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

type NavItem = { key: ModuleKey | "overview"; href: Pathname; live: boolean };

/**
 * The product shell: a fixed rail of modules, a working top bar, and the
 * page body. Built on the same tokens as the site, so the marketing
 * surface and the application read as one product.
 *
 * Modules without a page yet are rendered as present-but-inactive rather
 * than hidden — the system is visibly complete, and nothing here pretends
 * to be a working screen that isn't built.
 */
const NAV: NavItem[] = [
  { key: "overview", href: "/dashboard", live: true },
  { key: "finance", href: "/dashboard/finance", live: true },
  { key: "sales", href: "/dashboard/sales", live: true },
  { key: "crm", href: "/dashboard", live: false },
  { key: "inventory", href: "/dashboard", live: false },
  { key: "workflow", href: "/dashboard", live: false },
  { key: "hr", href: "/dashboard", live: false },
  { key: "analytics", href: "/dashboard", live: false },
];

export function DashboardShell({
  children,
  title,
  meta,
  actions,
}: {
  children: ReactNode;
  title: string;
  meta?: string;
  actions?: ReactNode;
}) {
  const t = useTranslations("dash");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5 px-2" aria-label={t("nav.aria")}>
      {NAV.map((item) => {
        const active = item.live && pathname === item.href;
        const label = t(`nav.${item.key}`);

        if (!item.live) {
          return (
            <span
              key={item.key}
              aria-disabled="true"
              title={t("nav.soon")}
              className="flex cursor-default items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2.5 text-[13px] text-steel/70"
            >
              <ModuleIcon
                name={item.key as ModuleKey}
                className="h-[17px] w-[17px] shrink-0"
              />
              <span className="truncate">{label}</span>
              <span className="t-label ms-auto shrink-0 text-steel/60">{t("nav.soon")}</span>
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2.5 text-[13px] transition-colors duration-[var(--t-base)]",
              active
                ? "bg-white/[0.07] text-offwhite"
                : "text-ink-inverse-muted hover:bg-white/[0.04] hover:text-silver"
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute inset-y-2 w-0.5 rounded-full bg-accent"
                style={{ insetInlineStart: 0 }}
              />
            ) : null}
            {item.key === "overview" ? (
              <OverviewIcon />
            ) : (
              <ModuleIcon
                name={item.key as ModuleKey}
                className="h-[17px] w-[17px] shrink-0"
              />
            )}
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-deep text-ink-inverse">
      {/* rail */}
      <aside className="fixed inset-y-0 z-40 hidden w-[236px] flex-col border-e border-line-dark bg-deep lg:flex" style={{ insetInlineStart: 0 }}>
        <div className="flex h-16 shrink-0 items-center border-b border-line-dark px-5">
          <Link href="/">
            <Logo tone="inverse" />
          </Link>
        </div>

        <div className="px-5 py-4">
          <p className="t-label text-steel">{t("workspace.label")}</p>
          <p className="mt-1.5 truncate text-[13.5px] font-semibold text-offwhite">
            {t("workspace.name")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4">{nav}</div>

        <div className="shrink-0 border-t border-line-dark p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-xs)] border border-line-dark bg-white/[0.05] text-[11px] font-bold text-silver">
              {t("user.initials")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] text-offwhite">{t("user.name")}</p>
              <p className="truncate text-[11.5px] text-steel">{t("user.role")}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* content column */}
      <div className="lg:ps-[236px]">
        <header className="sticky top-0 z-30 border-b border-line-dark bg-deep/95 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-5 md:px-8">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? t("nav.close") : t("nav.open")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border border-line-dark-strong text-silver lg:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                {open ? (
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
                ) : (
                  <path d="M1 4h14M1 8h14M1 12h14" stroke="currentColor" strokeWidth="1.5" />
                )}
              </svg>
            </button>

            <LogoMark tone="inverse" className="h-5 shrink-0 lg:hidden" />

            <div className="min-w-0 flex-1">
              <h1 className="t-h4 truncate text-offwhite">{title}</h1>
              {meta ? <p className="t-small truncate text-steel">{meta}</p> : null}
            </div>

            <span className="hidden items-center gap-2 rounded-[var(--radius-xs)] border border-line-dark px-3 py-2 text-[12.5px] text-steel md:inline-flex">
              <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="4" />
                <path d="M9 9l4 4" strokeLinecap="square" />
              </svg>
              {t("search")}
            </span>

            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            {actions}
          </div>
        </header>

        {/* mobile rail */}
        <div
          className={cn(
            "overflow-hidden border-b border-line-dark bg-deep transition-[max-height] duration-[var(--t-slow)] ease-[var(--ease-flow)] lg:hidden",
            open ? "max-h-[34rem]" : "max-h-0 border-b-0"
          )}
        >
          <div className="py-3">{nav}</div>
          <div className="flex items-center justify-between border-t border-line-dark px-5 py-4">
            <span className="text-[12.5px] text-steel">{t("workspace.name")}</span>
            <LanguageSwitcher />
          </div>
        </div>

        <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function OverviewIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[17px] w-[17px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M2.5 2.5h6v6h-6zM11.5 2.5h6v6h-6zM2.5 11.5h6v6h-6zM11.5 11.5h6v6h-6z" />
    </svg>
  );
}
