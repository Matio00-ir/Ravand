import { ensureSchema, getPool } from "@/lib/db";

/**
 * Schema for RAVAND's own management panel (/admin): users and sessions,
 * the sales pipeline, customers, contracts, invoicing, expenses,
 * implementation projects, support tickets and marketing. Same
 * idempotent bootstrap as lib/db.ts; every table is prefixed `adm_` so
 * it never collides with the public site's tables or a demo sandbox.
 */

let ready: Promise<void> | null = null;

const SQL = `
CREATE TABLE IF NOT EXISTS adm_users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS adm_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES adm_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_login_failures (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS adm_counters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS adm_customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  economic_code TEXT,
  postal_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_contacts (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES adm_customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  mobile TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_deals (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  mobile TEXT,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  value BIGINT NOT NULL DEFAULT 0,
  expected_close DATE,
  owner_id UUID REFERENCES adm_users(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES adm_customers(id) ON DELETE SET NULL,
  demo_lead_id UUID UNIQUE,
  expert_request_id UUID UNIQUE,
  contact_message_id UUID UNIQUE,
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS adm_deals_stage_idx ON adm_deals (stage);
CREATE INDEX IF NOT EXISTS adm_deals_mobile_idx ON adm_deals (mobile);

CREATE TABLE IF NOT EXISTS adm_activities (
  id BIGSERIAL PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES adm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS adm_activities_entity_idx ON adm_activities (entity, entity_id);

CREATE TABLE IF NOT EXISTS adm_tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal',
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  assignee_id UUID REFERENCES adm_users(id) ON DELETE SET NULL,
  entity TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS adm_tasks_entity_idx ON adm_tasks (entity, entity_id);

CREATE TABLE IF NOT EXISTS adm_catalog (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  unit TEXT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_quotes (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  deal_id BIGINT REFERENCES adm_deals(id) ON DELETE SET NULL,
  customer_id BIGINT REFERENCES adm_customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_at DATE NOT NULL,
  valid_until DATE NOT NULL,
  subtotal BIGINT NOT NULL,
  discount BIGINT NOT NULL DEFAULT 0,
  tax BIGINT NOT NULL,
  total BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_quote_lines (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES adm_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price BIGINT NOT NULL,
  line_total BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS adm_contracts (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES adm_customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  amount BIGINT NOT NULL DEFAULT 0,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  renewal_of BIGINT REFERENCES adm_contracts(id) ON DELETE SET NULL,
  quote_id BIGINT REFERENCES adm_quotes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_invoices (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES adm_customers(id) ON DELETE CASCADE,
  contract_id BIGINT REFERENCES adm_contracts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  issued_at DATE NOT NULL,
  due_at DATE NOT NULL,
  subtotal BIGINT NOT NULL,
  discount BIGINT NOT NULL DEFAULT 0,
  tax BIGINT NOT NULL,
  total BIGINT NOT NULL,
  paid BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_invoice_lines (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES adm_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price BIGINT NOT NULL,
  line_total BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS adm_payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES adm_invoices(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  paid_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_expenses (
  id BIGSERIAL PRIMARY KEY,
  spent_at DATE NOT NULL,
  category TEXT NOT NULL,
  amount BIGINT NOT NULL,
  vendor TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_projects (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES adm_customers(id) ON DELETE CASCADE,
  contract_id BIGINT REFERENCES adm_contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  start_date DATE,
  due_date DATE,
  golive_date DATE,
  manager_id UUID REFERENCES adm_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_project_phases (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES adm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE
);

CREATE TABLE IF NOT EXISTS adm_tickets (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES adm_customers(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES adm_projects(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'question',
  channel TEXT NOT NULL DEFAULT 'phone',
  assignee_id UUID REFERENCES adm_users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adm_campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  utm_campaign TEXT UNIQUE,
  budget BIGINT NOT NULL DEFAULT 0,
  spent BIGINT NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** Default service catalogue, written once into an empty adm_catalog. */
const CATALOG_SEED: [string, string, string, number][] = [
  ["پیاده‌سازی و راه‌اندازی روند", "implementation", "پروژه", 0],
  ["پشتیبانی و به‌روزرسانی سالانه", "support", "سال", 0],
  ["آموزش کاربران", "training", "جلسه", 0],
  ["توسعه و سفارشی‌سازی", "custom", "ساعت", 0],
  ["انتقال داده از سیستم قبلی", "implementation", "پروژه", 0],
];

export function ensureAdminSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await ensureSchema();
      const pool = getPool();
      await pool.query(SQL);
      const seeded = await pool.query(`SELECT 1 FROM adm_catalog LIMIT 1`);
      if (seeded.rows.length === 0) {
        for (const [name, kind, unit, price] of CATALOG_SEED) {
          await pool.query(`INSERT INTO adm_catalog (name, kind, unit, price) VALUES ($1, $2, $3, $4)`, [
            name,
            kind,
            unit,
            price,
          ]);
        }
      }
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

/** Shorthand for an admin query after the schema exists. */
export async function q<T extends object = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureAdminSchema();
  const res = await getPool().query(sql, params);
  return res.rows as T[];
}

export async function q1<T extends object = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Next document number for a series, e.g. nextNumber("invoice", "INV")
 * → "INV-1405-0007". Year is the Jalali year, so numbering restarts each
 * year the way Iranian bookkeeping expects.
 */
export async function nextNumber(series: string, prefix: string, jalaliYear: string): Promise<string> {
  await ensureAdminSchema();
  const key = `${series}:${jalaliYear}`;
  const res = await getPool().query<{ value: number }>(
    `INSERT INTO adm_counters (key, value) VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET value = adm_counters.value + 1
     RETURNING value`,
    [key]
  );
  return `${prefix}-${jalaliYear}-${String(res.rows[0].value).padStart(4, "0")}`;
}
