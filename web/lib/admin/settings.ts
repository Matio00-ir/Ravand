import { q, q1 } from "@/lib/admin/schema";
import { AdminError } from "@/lib/admin/auth";

/**
 * Key/value settings (company details for invoices, VAT rate, the site
 * announcement), live option lists for selects, and the shared math for
 * documents with line items (quotes, invoices).
 */

export type Company = {
  legal_name?: string;
  brand?: string;
  national_id?: string;
  economic_code?: string;
  registration_no?: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  bank?: string;
  vat_rate?: number;
  invoice_note?: string;
};

export type Announcement = {
  active?: boolean;
  text?: string;
  text_en?: string;
  link_url?: string;
  link_label?: string;
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await q1<{ value: T }>(`SELECT value FROM adm_settings WHERE key = $1`, [key]);
  return row ? { ...fallback, ...row.value } : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await q(
    `INSERT INTO adm_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

export const getCompany = () => getSetting<Company>("company", { brand: "روند", vat_rate: 10 });

export async function vatRate(): Promise<number> {
  const c = await getCompany();
  return typeof c.vat_rate === "number" ? c.vat_rate : 10;
}

/* ---------------- options for selects ---------------- */

type Opt = { value: string; label: string }[];

export async function customerOptions(): Promise<Opt> {
  const rows = await q<{ id: number; name: string }>(`SELECT id, name FROM adm_customers ORDER BY name`);
  return rows.map((r) => ({ value: String(r.id), label: r.name }));
}

export async function userOptions(): Promise<Opt> {
  const rows = await q<{ id: string; name: string }>(`SELECT id, name FROM adm_users WHERE active ORDER BY name`);
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

export async function contractOptions(): Promise<Opt> {
  const rows = await q<{ id: number; number: string; title: string; customer: string }>(
    `SELECT k.id, k.number, k.title, c.name AS customer FROM adm_contracts k JOIN adm_customers c ON c.id = k.customer_id
     WHERE k.status IN ('draft', 'active') ORDER BY k.created_at DESC`
  );
  return rows.map((r) => ({ value: String(r.id), label: `${r.number} — ${r.customer} — ${r.title}` }));
}

export type CatalogItem = { id: number; name: string; kind: string; unit: string; price: number; description: string | null; active: boolean };

export function listCatalog(activeOnly = false): Promise<CatalogItem[]> {
  return q<CatalogItem>(`SELECT * FROM adm_catalog ${activeOnly ? "WHERE active" : ""} ORDER BY kind, name`);
}

/* ---------------- line items ---------------- */

export type Line = { description: string; qty: number; unit_price: number };

/** Reads the lines editor's JSON payload; at least one complete line. */
export function parseLines(fd: FormData): Line[] {
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("lines") ?? "[]"));
  } catch {
    throw new AdminError("noLines");
  }
  if (!Array.isArray(raw)) throw new AdminError("noLines");
  const lines = raw
    .map((l) => ({
      description: String(l?.description ?? "").trim().slice(0, 300),
      qty: Number(l?.qty),
      unit_price: Number(l?.unit_price),
    }))
    .filter(
      (l) =>
        l.description &&
        Number.isSafeInteger(l.qty) &&
        l.qty > 0 &&
        l.qty <= 100_000 &&
        Number.isSafeInteger(l.unit_price) &&
        l.unit_price >= 0 &&
        l.unit_price <= 1_000_000_000_000
    );
  if (lines.length === 0 || lines.length > 40) throw new AdminError("noLines");
  return lines;
}

/** Subtotal, discount (capped at subtotal), VAT on the discounted amount, total. */
export function totals(lines: Line[], discount: number, vatPercent: number, applyVat: boolean) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const d = Math.min(Math.max(0, discount), subtotal);
  const tax = applyVat ? Math.round(((subtotal - d) * vatPercent) / 100) : 0;
  return { subtotal, discount: d, tax, total: subtotal - d + tax };
}
