import { type ReactNode } from "react";
import NextLink from "next/link";
import { Panel, PanelHead, Status } from "@/components/dashboard/ui";
import { isoToJalali } from "@/lib/admin/jalali";
import { labelOf, toneOf } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";

/**
 * Server-safe building blocks for admin pages, on top of the dashboard
 * UI kit (Panel, Table, StatTile…) so the panel and the product demo
 * share one visual system.
 */

const nf = new Intl.NumberFormat("fa-IR");
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const fa = (n: number) => nf.format(n);
export const faDigits = (s: string) => s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

/** "2026-11-03" → "۱۴۰۵/۰۸/۱۲" */
export function jdate(iso: string | null | undefined): string {
  return iso ? faDigits(isoToJalali(iso)) : "—";
}

/** A timestamp as Jalali date + time, Tehran time. */
export function jdatetime(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(d);
}

export const isoOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(d);

/** Millions of Toman for stat tiles: 1_250_000_000 → "۱٬۲۵۰". */
export function millions(toman: number): string {
  const m = toman / 1_000_000;
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: Math.abs(m) < 100 ? 1 : 0 }).format(m);
}

export function Money({ value, unit = false, className }: { value: number; unit?: boolean; className?: string }) {
  return (
    <span className={cn("t-num whitespace-nowrap", className)}>
      {fa(value)}
      {unit ? <span className="ms-1 text-[11px] text-steel">تومان</span> : null}
    </span>
  );
}

export function Badge({ map, value }: { map: Parameters<typeof labelOf>[0]; value: string | null | undefined }) {
  return <Status tone={toneOf(map, value)}>{labelOf(map, value)}</Status>;
}

export function PageHeader({
  title,
  meta,
  actions,
  back,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 print:hidden">
      {back ? (
        <NextLink href={back.href} className="t-small mb-3 inline-block text-silver hover:text-offwhite">
          → {back.label}
        </NextLink>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="t-h3 text-offwhite">{title}</h1>
          {meta ? <div className="t-small mt-1.5 text-steel">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Section({
  title,
  meta,
  action,
  flush = false,
  className,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel flush={flush} className={className}>
      <PanelHead title={title} meta={meta} action={action} className={flush ? "p-5" : undefined} />
      <div className={flush ? undefined : "mt-5"}>{children}</div>
    </Panel>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <NextLink
      href={href}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-xs)] px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-[var(--t-base)]",
        variant === "primary" ? "bg-offwhite text-black hover:bg-white" : "border border-line-dark-strong text-silver hover:text-offwhite"
      )}
    >
      {children}
    </NextLink>
  );
}

export function A({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <NextLink href={href} className={cn("text-offwhite underline-offset-4 hover:underline", className)}>
      {children}
    </NextLink>
  );
}

export function Empty({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-5 py-10 text-center text-[13px] text-steel">
          {children}
        </td>
      </tr>
    );
  }
  return <p className="py-8 text-center text-[13px] text-steel">{children}</p>;
}

/** A definition list of label/value pairs for detail pages. */
export function Facts({ items, cols = 2 }: { items: [string, ReactNode][]; cols?: 2 | 3 | 4 }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", grid)}>
      {items.map(([k, val]) => (
        <div key={k} className="min-w-0">
          <dt className="t-label text-steel">{k}</dt>
          <dd className="mt-1 break-words text-[13.5px] text-offwhite">{val ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tab-like filter links. */
export function Tabs({ items }: { items: { href: string; label: string; count?: number; active: boolean }[] }) {
  return (
    <nav className="flex flex-wrap gap-1" aria-label="فیلتر">
      {items.map((it) => (
        <NextLink
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] px-3 py-1.5 text-[12.5px] transition-colors duration-[var(--t-base)]",
            it.active ? "bg-white/[0.09] text-offwhite" : "text-steel hover:text-silver"
          )}
        >
          {it.label}
          {it.count !== undefined ? <span className="t-num text-[11px] text-steel">{fa(it.count)}</span> : null}
        </NextLink>
      ))}
    </nav>
  );
}
