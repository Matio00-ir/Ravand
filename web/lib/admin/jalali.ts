/**
 * Jalali (Persian) ⇄ Gregorian conversion for the admin panel's date
 * fields. Display already goes through Intl's persian calendar
 * (lib/format.ts); this exists for the other direction — turning what
 * someone types ("۱۴۰۵/۰۸/۱۲") into a date the database can store.
 * Algorithm: the standard jalaali-js arithmetic (Borkowski).
 */

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

function jalCal(jy: number) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-03" → "1405/08/12" (Latin digits). */
export function isoToJalali(iso: string): string {
  const [gy, gm, gd] = iso.slice(0, 10).split("-").map(Number);
  const { jy, jm, jd } = d2j(g2d(gy, gm, gd));
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/**
 * Parses a typed Jalali date — Persian, Arabic or Latin digits, with
 * "/", "-" or "." between parts — into "YYYY-MM-DD" Gregorian, or null.
 */
export function jalaliToIso(input: string): string | null {
  const s = input
    .trim()
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)));
  const m = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(s);
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd));
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

/** Today in Tehran, "YYYY-MM-DD". */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addYearsIso(iso: string, years: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today (Tehran) to `iso`; negative when past. */
export function daysFromToday(iso: string): number {
  const a = new Date(`${todayIso()}T12:00:00Z`).getTime();
  const b = new Date(`${iso.slice(0, 10)}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Jalali year-month key for grouping, e.g. "1405-08". */
export function jalaliMonthKey(iso: string): string {
  return isoToJalali(iso).slice(0, 7).replace("/", "-");
}

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

export function jalaliMonthName(key: string): string {
  return MONTHS[Number(key.slice(5, 7)) - 1] ?? key;
}

/** The last `count` Jalali month keys ending with the current month, oldest first. */
export function lastJalaliMonths(count: number): string[] {
  const out: string[] = [];
  let iso = todayIso();
  while (out.length < count) {
    const key = jalaliMonthKey(iso);
    if (!out.includes(key)) out.push(key);
    iso = addDaysIso(iso, -27);
  }
  return out.reverse();
}

/** Epoch milliseconds `days` ago — for "in the last N days" filters. */
export function msAgo(days: number): number {
  return Date.now() - days * 86_400_000;
}
