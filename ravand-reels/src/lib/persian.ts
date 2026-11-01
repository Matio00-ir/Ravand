/**
 * Persian text helpers. Rule for the whole project: text is only ever split
 * on spaces (into words) or on explicit line breaks — never into characters,
 * which would break Arabic-script joining. ZWNJ (U+200C) is not a space and
 * stays inside its word.
 */

const FA = "۰۱۲۳۴۵۶۷۸۹";

/** Latin and Arabic-Indic digits → Persian digits. Everything else untouched. */
export const faDigits = (s: string): string =>
  s.replace(/[0-9]/g, (d) => FA[Number(d)]).replace(/[٠-٩]/g, (d) => FA["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

/** Canonical word split — must match scripts/lib/align-core.mjs splitWords(). */
export const splitWords = (text: string): string[] => text.trim().split(/ +/).filter(Boolean);

/** For matching beats against script words: drop punctuation and ZWNJ-insensitive compare. */
export const bare = (w: string): string => w.replace(/[‌،؛؟.!…«»:,;?"'()]/g, "");

/** Three dots in the script render as a real ellipsis. */
export const display = (s: string): string => faDigits(s.replace(/\.\.\./g, "…"));

/** Whether a word ends a clause (for caption grouping). */
export const endsClause = (w: string): boolean => /[،؛؟.!…:]$|\.\.\.$/.test(w);
