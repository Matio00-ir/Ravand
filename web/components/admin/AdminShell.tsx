"use client";

import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export type NavGroup = { label: string; items: { href: string; label: string; badge?: number }[] };

/**
 * Chrome for the admin panel: a grouped rail (only the areas this user's
 * role may open), a top bar with global search, and the page. Pages
 * render their own header (components/admin/ui PageHeader).
 */
export function AdminShell({
  nav,
  userName,
  roleLabel,
  logout,
  children,
}: {
  nav: NavGroup[];
  userName: string;
  roleLabel: string;
  logout: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Under the [locale] segment the fa panel is served at /admin/…
  const path = pathname.replace(/^\/(fa|en)(?=\/)/, "");

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));

  const rail = (
    <nav className="space-y-5 px-3 pb-6" aria-label="بخش‌های پنل">
      {nav.map((group) => (
        <div key={group.label}>
          {group.label ? <p className="t-label mb-1.5 px-2 text-steel/80">{group.label}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <NextLink
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-[13.5px] transition-colors duration-[var(--t-base)]",
                      active ? "bg-white/[0.07] text-offwhite" : "text-ink-inverse-muted hover:bg-white/[0.04] hover:text-silver"
                    )}
                  >
                    {active ? (
                      <span aria-hidden="true" className="absolute inset-y-2 w-0.5 rounded-full bg-accent" style={{ insetInlineStart: 0 }} />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="t-num ms-auto rounded-full bg-accent/25 px-1.5 py-px text-[11px] text-offwhite">
                        {new Intl.NumberFormat("fa-IR").format(item.badge)}
                      </span>
                    ) : null}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-deep text-ink-inverse">
      <aside
        className="fixed inset-y-0 z-40 hidden w-[240px] flex-col border-e border-line-dark bg-deep print:hidden lg:flex"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line-dark px-5">
          <NextLink href="/admin">
            <Logo tone="inverse" />
          </NextLink>
          <span className="t-label text-steel">مدیریت</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-5">{rail}</div>
        <div className="shrink-0 border-t border-line-dark p-4">
          <NextLink href="/admin/account" className="block truncate text-[13px] text-offwhite hover:underline">
            {userName}
          </NextLink>
          <p className="text-[11.5px] text-steel">{roleLabel}</p>
          <div className="mt-3 flex items-center gap-4 text-[12.5px]">
            <NextLink href="/" className="text-steel hover:text-silver">
              سایت
            </NextLink>
            <form action={logout}>
              <button type="submit" className="text-steel hover:text-silver">
                خروج
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:ps-[240px]">
        <header className="sticky top-0 z-30 border-b border-line-dark bg-deep/95 backdrop-blur-md print:hidden">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <button
              type="button"
              onClick={() => setOpen((x) => !x)}
              aria-expanded={open}
              aria-label={open ? "بستن منو" : "باز کردن منو"}
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
            <form action="/admin/search" method="get" className="relative min-w-0 flex-1 md:max-w-md" role="search">
              <label htmlFor="admin-search" className="sr-only">
                جستجو
              </label>
              <input
                id="admin-search"
                name="q"
                type="search"
                placeholder="جستجوی مشتری، فرصت، فاکتور، تیکت…"
                className="w-full rounded-[var(--radius-xs)] border border-line-dark-strong bg-deep-raised px-3 py-2 text-[13px] text-offwhite placeholder:text-steel/70 focus:border-accent focus:outline-none"
              />
            </form>
          </div>
        </header>

        <div
          className={cn(
            "overflow-hidden border-b border-line-dark bg-deep transition-[max-height] duration-[var(--t-slow)] print:hidden lg:hidden",
            open ? "max-h-[80vh] overflow-y-auto" : "max-h-0 border-b-0"
          )}
        >
          <div className="pt-4">{rail}</div>
          <div className="flex items-center justify-between border-t border-line-dark px-5 py-4 text-[12.5px]">
            <NextLink href="/admin/account" onClick={() => setOpen(false)} className="text-silver">
              {userName}
            </NextLink>
            <form action={logout}>
              <button type="submit" className="text-steel hover:text-silver">
                خروج
              </button>
            </form>
          </div>
        </div>

        <main className="px-4 py-6 md:px-8 md:py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
