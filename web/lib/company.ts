/**
 * RAVAND company information — the ONE place to edit contact details and
 * trust content (team, story, customers, eNamad).
 *
 * Rule: every trust section below stays HIDDEN on the site while its data
 * is empty. An empty box or a "coming soon" on a trust section reads as
 * "not finished", which is the opposite of what it is there for. Fill the
 * data and the section appears; nothing else needs to change.
 *
 * Text that visitors read is given in both languages as { fa, en }.
 */

export type Localized = { fa: string; en: string };

export function pick(text: Localized, locale: string): string {
  return locale === "fa" ? text.fa : text.en;
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  /** One number for calls, WhatsApp and Telegram. Digits only, local form. */
  phone: "09052176711",
  /** The same number in international form, without "+" (for links). */
  phoneIntl: "989052176711",
  /** Shown as typed; the en string is used on the English site. */
  phoneDisplay: { fa: "۰۹۰۵ ۲۱۷ ۶۷۱۱", en: "+98 905 217 6711" } satisfies Localized,
  hours: {
    fa: "شنبه تا چهارشنبه، ۹ تا ۱۷",
    en: "Saturday to Wednesday, 9:00–17:00 (Iran time)",
  } satisfies Localized,
  /** City only for now; replace with the full address when it is ready. */
  address: { fa: "اصفهان", en: "Isfahan, Iran" } satisfies Localized,
  addressLocality: "Isfahan",
} as const;

export const CONTACT_LINKS = {
  tel: `tel:+${CONTACT.phoneIntl}`,
  whatsapp: `https://wa.me/${CONTACT.phoneIntl}`,
  // Opens a Telegram chat by phone number. This only works if the
  // account's privacy setting lets everyone find it by number; if it
  // doesn't, set `telegramUsername` below and that link is used instead.
  telegram: `https://t.me/+${CONTACT.phoneIntl}`,
};

/** Optional: a Telegram @username (without "@"). Preferred when set. */
export const telegramUsername = "";

export function telegramLink(): string {
  return telegramUsername ? `https://t.me/${telegramUsername}` : CONTACT_LINKS.telegram;
}

/* ------------------------------------------------------------------ */
/* Team & story — shown on /company/about when filled                  */
/* ------------------------------------------------------------------ */

export type TeamMember = {
  name: Localized;
  role: Localized;
  /** One or two sentences: what this person does for customers. */
  bio?: Localized;
  /** Image in /public, e.g. "/team/matin.jpg" (square, at least 400px). */
  photo?: string;
};

/** Example:
 *  { name: { fa: "...", en: "..." }, role: { fa: "بنیان‌گذار", en: "Founder" },
 *    photo: "/team/name.jpg" }
 */
export const TEAM: TeamMember[] = [];

/** The founding story: a few short paragraphs. Leave empty to hide. */
export const STORY: Localized[] = [];

/* ------------------------------------------------------------------ */
/* Customers — shown on the home page when filled                      */
/* ------------------------------------------------------------------ */

export type Customer = {
  name: Localized;
  /** e.g. { fa: "کارگاه تولیدی", en: "Manufacturing workshop" } */
  industry: Localized;
  /** Optional logo in /public, e.g. "/customers/name.svg". */
  logo?: string;
  /** Optional short quote — only with the customer's permission. */
  quote?: Localized;
  /** Who said the quote, e.g. { fa: "مدیر فروش", en: "Head of sales" }. */
  quoteBy?: Localized;
};

/** Add only real customers who agreed to be named. */
export const CUSTOMERS: Customer[] = [];

/* ------------------------------------------------------------------ */
/* eNamad (نماد اعتماد الکترونیکی) — shown in the footer when filled     */
/* ------------------------------------------------------------------ */

/**
 * From the snippet eNamad gives you: it contains a link like
 *   https://trustseal.enamad.ir/?id=123456&Code=AbCdEf
 * Copy the `id` and `Code` values here.
 */
export const ENAMAD = { id: "", code: "" };

export const hasEnamad = () => Boolean(ENAMAD.id && ENAMAD.code);
