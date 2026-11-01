import { jalaliToIso } from "@/lib/admin/jalali";

/**
 * One field description drives both sides of every admin form: the
 * client renders inputs from it (components/admin/EntityForm) and the
 * server action validates and normalizes the submission with the same
 * description, so a form and its validation can't drift apart.
 */

export type FieldType = "text" | "textarea" | "money" | "int" | "date" | "select" | "checkbox" | "tel" | "email" | "password";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  /** Grid columns out of 4 on wide screens (default 2; textarea 4). */
  span?: 1 | 2 | 3 | 4;
  /** Allow an empty choice on a non-required select. */
  allowEmpty?: boolean;
};

export type FieldValue = string | number | boolean | null;
export type Values = Record<string, FieldValue>;

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

export function latinDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)));
}

/** "۱۲٬۵۰۰٬۰۰۰" / "12,500,000" → 12500000; null when not a whole number. */
export function parseAmount(raw: string): number | null {
  const s = latinDigits(raw).replace(/[,٬،\s]/g, "");
  if (!/^-?\d{1,15}$/.test(s)) return null;
  return Number(s);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates `fd` against `defs`. Errors are short codes (required,
 * invalid, tooLong) the form maps to Persian copy.
 */
export function parseFields(fd: FormData, defs: FieldDef[]): { values: Values; errors: Record<string, string> } {
  const values: Values = {};
  const errors: Record<string, string> = {};

  for (const def of defs) {
    const raw = fd.get(def.name);
    const str = typeof raw === "string" ? raw.trim() : "";

    if (def.type === "checkbox") {
      values[def.name] = raw === "on";
      continue;
    }
    if (!str) {
      values[def.name] = null;
      if (def.required) errors[def.name] = "required";
      continue;
    }
    if (str.length > (def.max ?? (def.type === "textarea" ? 4000 : 200))) {
      errors[def.name] = "tooLong";
      continue;
    }

    switch (def.type) {
      case "money":
      case "int": {
        const n = parseAmount(str);
        if (n === null || n < 0) errors[def.name] = "invalid";
        else values[def.name] = n;
        break;
      }
      case "date": {
        const iso = jalaliToIso(str);
        if (!iso) errors[def.name] = "date";
        else values[def.name] = iso;
        break;
      }
      case "select": {
        if (def.options && !def.options.some((o) => o.value === str)) errors[def.name] = "invalid";
        else values[def.name] = str;
        break;
      }
      case "email": {
        if (!EMAIL_RE.test(str)) errors[def.name] = "invalid";
        else values[def.name] = str.toLowerCase();
        break;
      }
      case "tel": {
        const t = latinDigits(str).replace(/[^\d+\-\s]/g, "").trim();
        if (t.length < 4) errors[def.name] = "invalid";
        else values[def.name] = t;
        break;
      }
      default:
        values[def.name] = def.type === "textarea" || def.type === "password" ? str : str.replace(/\s+/g, " ");
    }
  }
  return { values, errors };
}

/** Typed accessors over parsed values. */
export const v = {
  s: (vals: Values, k: string) => (vals[k] === null || vals[k] === undefined ? null : String(vals[k])),
  n: (vals: Values, k: string) => (typeof vals[k] === "number" ? (vals[k] as number) : 0),
  b: (vals: Values, k: string) => vals[k] === true,
};

/** The subset of a database row a form needs, keyed by its field names. */
export function valuesFor(defs: FieldDef[], row: object): Values {
  const out: Values = {};
  const r = row as Record<string, unknown>;
  for (const d of defs) {
    const val = r[d.name];
    out[d.name] = val === undefined || val === null ? null : typeof val === "number" || typeof val === "boolean" ? val : String(val);
  }
  return out;
}
