/** Persian (Jalali) calendar for fa, Gregorian for en — matches the static
 *  "شهریور ۱۴۰۵"-style dates already used throughout messages/fa.json. */
export function formatDate(date: Date, locale: string): string {
  const intlLocale = locale === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(date);
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}

/** Compact numeric date for tables: "۱۴۰۵/۰۷/۲۸" in fa, "10/20/2026" in en. */
export function formatShortDate(date: Date, locale: string): string {
  const intlLocale = locale === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Toman amount scaled to millions for stat tiles: 1_248_000_000 → "۱٬۲۴۸". */
export function formatMillions(toman: number, locale: string): string {
  const m = toman / 1_000_000;
  const digits = Math.abs(m) < 100 ? 1 : 0;
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: digits }).format(m);
}

/** Signed percent for deltas: 12.5 → "+۱۲٫۵٪". */
export function formatPercentChange(pct: number, locale: string): string {
  const s = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(pct);
  return `${s}${locale === "fa" ? "٪" : "%"}`;
}

/** Document numbers (invoice #1023): locale digits, never a thousands separator. */
export function formatCode(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false }).format(n);
}
