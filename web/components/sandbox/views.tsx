import { type ReactNode } from "react";
import NextLink from "next/link";
import { Status, type StatusTone } from "@/components/dashboard/ui";
import { isOverdue, type Invoice } from "@/lib/sandbox/store";
import { formatNumber } from "@/lib/format";

/**
 * Small server-safe pieces shared by the sandbox screens.
 */

/**
 * A path inside one customer's demo. Built by hand rather than with
 * next-intl's typed helpers, for the same reason as the Shell's nav:
 * /demo/[token] is deliberately not in the typed `pathnames` map.
 */
export function demoHref(locale: string, token: string, path = ""): string {
  return `${locale === "en" ? "/en" : ""}/demo/${token}${path}`;
}

export function Money({ value, locale, unit }: { value: number; locale: string; unit?: string }) {
  return (
    <span className="t-num whitespace-nowrap">
      {formatNumber(value, locale)}
      {unit ? <span className="ms-1 text-[11px] text-steel">{unit}</span> : null}
    </span>
  );
}

const statusTone: Record<string, StatusTone> = {
  issued: "info",
  partial: "warning",
  paid: "success",
  cancelled: "neutral",
  overdue: "error",
};

/** Status with "overdue" derived from the due date rather than stored. */
export function invoiceStatusKey(inv: Pick<Invoice, "status" | "dueAt">): string {
  return isOverdue(inv) ? "overdue" : inv.status;
}

export function InvoiceStatus({ invoice, label }: { invoice: Pick<Invoice, "status" | "dueAt">; label: (key: string) => string }) {
  const key = invoiceStatusKey(invoice);
  return <Status tone={statusTone[key] ?? "neutral"}>{label(key)}</Status>;
}

export function RowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <NextLink href={href} className={`text-offwhite underline-offset-4 hover:underline ${className ?? ""}`}>
      {children}
    </NextLink>
  );
}

export function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NextLink
      href={href}
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-xs)] bg-offwhite px-3.5 py-2 text-[12.5px] font-semibold text-black transition-colors duration-[var(--t-base)] hover:bg-white"
    >
      {children}
    </NextLink>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-[13px] text-steel">
        {children}
      </td>
    </tr>
  );
}

/** Tab-like filter links over a list, driven by a search param. */
export function FilterTabs({
  items,
}: {
  items: { href: string; label: string; count?: string; active: boolean }[];
}) {
  return (
    <nav className="flex flex-wrap gap-1" aria-label="filter">
      {items.map((it) => (
        <NextLink
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] px-3 py-1.5 text-[12.5px] transition-colors duration-[var(--t-base)] ${
            it.active ? "bg-white/[0.09] text-offwhite" : "text-steel hover:text-silver"
          }`}
        >
          {it.label}
          {it.count ? <span className="t-num text-[11px] text-steel">{it.count}</span> : null}
        </NextLink>
      ))}
    </nav>
  );
}
