/** Persian (Jalali) calendar for fa, Gregorian for en — matches the static
 *  "شهریور ۱۴۰۵"-style dates already used throughout messages/fa.json. */
export function formatDate(date: Date, locale: string): string {
  const intlLocale = locale === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(date);
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
}
