/**
 * Shared, dependency-free server-side validation for the Contact and Demo
 * forms. No validation library is in package.json, and these payloads are
 * simple enough (a handful of scalar text fields) that adding one would be
 * more code than this. Every rule here mirrors the `required`/`type`
 * attributes already on the client fields — this is what actually
 * enforces them, since HTML attributes are trivially bypassable.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose and intentionally international: digits, spaces, and the usual
// separators, 6–20 characters. Rejects letters/scripts, not a specific
// country's numbering plan (the app has no declared target-country phone
// format, and being too strict would reject legitimate international
// numbers).
const PHONE_RE = /^[0-9+()\-.\s]{6,20}$/;

/**
 * Iranian mobile numbers only — the demo builder is Iran-focused and asks
 * for a mobile number instead of email, so this is deliberately stricter
 * than PHONE_RE above (which stays as-is for the general contact form).
 * Accepts the common ways people type a mobile number (spaces/dashes,
 * leading 0098/+98, or the bare 9-first form with the leading 0 dropped)
 * and normalizes all of them to the canonical `09XXXXXXXXX` (11 digits).
 */
export function normalizeIranMobile(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const digits = value.trim().replace(/[\s\-().]/g, "");
  let national: string | null = null;

  if (/^09\d{9}$/.test(digits)) national = digits;
  else if (/^989\d{9}$/.test(digits)) national = `0${digits.slice(2)}`;
  else if (/^\+989\d{9}$/.test(digits)) national = `0${digits.slice(3)}`;
  else if (/^009989\d{8}$/.test(digits)) national = null; // malformed, falls through
  else if (/^00989\d{9}$/.test(digits)) national = `0${digits.slice(4)}`;
  else if (/^9\d{9}$/.test(digits)) national = `0${digits}`;

  return national;
}

/** Collapses internal whitespace runs and trims the ends. */
function normalize(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

export type FieldErrors = Record<string, string>;

type Rule = {
  required?: boolean;
  maxLength: number;
  kind?: "email" | "phone" | "iranMobile";
  oneOf?: readonly string[];
};

/**
 * Validates `formData` against `schema`, returning normalized values for
 * every field in the schema plus any errors. Error values are message
 * keys (e.g. "required", "email", "tooLong") resolved to copy by the
 * caller via the `common.formErrors` message namespace — this module
 * stays locale-agnostic.
 */
export function validateFields(
  formData: FormData,
  schema: Record<string, Rule>
): { values: Record<string, string>; errors: FieldErrors } {
  const values: Record<string, string> = {};
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = normalize(formData.get(field));
    values[field] = value;

    if (!value) {
      if (rule.required) errors[field] = "required";
      continue;
    }
    if (value.length > rule.maxLength) {
      errors[field] = "tooLong";
      continue;
    }
    if (rule.kind === "email" && !EMAIL_RE.test(value)) {
      errors[field] = "email";
      continue;
    }
    if (rule.kind === "phone" && !PHONE_RE.test(value)) {
      errors[field] = "phone";
      continue;
    }
    if (rule.kind === "iranMobile") {
      const canonical = normalizeIranMobile(value);
      if (!canonical) {
        errors[field] = "phone";
        continue;
      }
      values[field] = canonical;
    }
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors[field] = "invalid";
      continue;
    }
  }

  return { values, errors };
}

/**
 * Anti-abuse checks shared by both actions, independent of field
 * validation: a honeypot field a real visitor never sees or fills, and a
 * minimum render-to-submit time (bots that fill and submit a form in a
 * few milliseconds are almost never a human). Both fail silently from the
 * caller's point of view — see the actions in app/actions.ts.
 */
export function looksLikeAbuse(formData: FormData): boolean {
  const honeypot = normalize(formData.get("website"));
  if (honeypot) return true;

  const startedAt = Number(formData.get("startedAt"));
  if (!Number.isFinite(startedAt) || startedAt <= 0) return true;
  const elapsed = Date.now() - startedAt;
  const MIN_MS = 1500;
  const MAX_MS = 1000 * 60 * 60; // 1h — a stale/tampered timestamp, not a real session
  if (elapsed < MIN_MS || elapsed > MAX_MS) return true;

  return false;
}

/** Hard cap on total submitted size, independent of per-field limits. */
export function payloadTooLarge(formData: FormData, maxBytes = 8_000): boolean {
  let total = 0;
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") total += key.length + value.length;
  }
  return total > maxBytes;
}

export const contactSchema: Record<string, Rule> = {
  name: { required: true, maxLength: 100 },
  company: { maxLength: 150 },
  email: { required: true, maxLength: 254, kind: "email" },
  phone: { maxLength: 30, kind: "phone" },
  message: { required: true, maxLength: 2000 },
};

/**
 * The RAVAND builder's final step: just enough to create and notify the
 * team about a private demo. No email (Iran-focused, mobile-first — see
 * normalizeIranMobile above); business type/modules/workflow/user count
 * come from the builder's own state, validated separately in the action
 * against the known preset/module vocabulary (they're structured data,
 * not free text, so the Rule shape here doesn't fit them).
 */
export const demoLeadSchema: Record<string, Rule> = {
  name: { required: true, maxLength: 100 },
  company: { required: true, maxLength: 150 },
  mobile: { required: true, maxLength: 20, kind: "iranMobile" },
};
