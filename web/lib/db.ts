import { Pool } from "pg";

/**
 * Single shared Postgres pool for the whole app.
 *
 * Cached on `globalThis` so Next.js's dev-mode module reloading (and
 * repeated Server Action invocations within one warm serverless instance
 * on Vercel) reuse one pool instead of opening a new one per reload/call.
 * `max: 3` is deliberately small — this app makes a handful of short
 * queries per request, not a connection-heavy workload, and Vercel's
 * serverless functions each get their own process, so many small pools
 * across instances is the actual shape of the load, not one big pool.
 */

declare global {
  var __ravandPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Demo lead persistence requires a Postgres connection string (see .env.example)."
    );
  }

  // Managed Postgres (Neon, Vercel Postgres, Supabase, RDS, ...) requires
  // TLS in production. `PGSSLMODE=disable` opts out for a local/self-hosted
  // database that has no TLS listener.
  const sslDisabled = process.env.PGSSLMODE === "disable";

  return new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
    ssl: sslDisabled ? undefined : { rejectUnauthorized: false },
  });
}

export function getPool(): Pool {
  if (!global.__ravandPgPool) {
    global.__ravandPgPool = createPool();
  }
  return global.__ravandPgPool;
}

let schemaReady: Promise<void> | null = null;

/**
 * Idempotent bootstrap — no separate migration tool for a single table.
 * Guarded by a module-level promise so concurrent requests on a warm
 * instance don't race to run `CREATE TABLE` multiple times; `IF NOT
 * EXISTS` makes it safe even across cold starts / multiple instances.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS demo_leads (
          id UUID PRIMARY KEY,
          token_hash TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          mobile TEXT NOT NULL,
          business_type TEXT NOT NULL,
          user_count INTEGER NOT NULL,
          modules JSONB NOT NULL,
          workflow JSONB NOT NULL,
          config JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL,
          last_accessed_at TIMESTAMPTZ,
          access_count INTEGER NOT NULL DEFAULT 0,
          notify_sms_status TEXT,
          notify_email_status TEXT,
          notify_error TEXT
        );
        CREATE INDEX IF NOT EXISTS demo_leads_status_idx ON demo_leads (status);
        CREATE INDEX IF NOT EXISTS demo_leads_mobile_idx ON demo_leads (mobile);
        ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS seeded_at TIMESTAMPTZ;
        ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
        ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS team_note TEXT;

        -- Per-demo sandbox: a small but real business dataset each
        -- customer owns and edits (see lib/sandbox/). Every row hangs off
        -- demo_leads, so deleting a lead removes its whole sandbox.
        CREATE TABLE IF NOT EXISTS sb_customers (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          phone TEXT,
          city TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS sb_customers_lead_idx ON sb_customers (lead_id);

        CREATE TABLE IF NOT EXISTS sb_products (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          sku TEXT NOT NULL,
          name TEXT NOT NULL,
          unit TEXT NOT NULL,
          price BIGINT NOT NULL,
          track_stock BOOLEAN NOT NULL DEFAULT true,
          stock INTEGER NOT NULL DEFAULT 0,
          reorder_point INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (lead_id, sku)
        );

        CREATE TABLE IF NOT EXISTS sb_invoices (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          number INTEGER NOT NULL,
          customer_id BIGINT NOT NULL REFERENCES sb_customers(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          issued_at TIMESTAMPTZ NOT NULL,
          due_at TIMESTAMPTZ NOT NULL,
          subtotal BIGINT NOT NULL,
          tax BIGINT NOT NULL,
          total BIGINT NOT NULL,
          paid BIGINT NOT NULL DEFAULT 0,
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (lead_id, number)
        );

        CREATE TABLE IF NOT EXISTS sb_invoice_lines (
          id BIGSERIAL PRIMARY KEY,
          invoice_id BIGINT NOT NULL REFERENCES sb_invoices(id) ON DELETE CASCADE,
          product_id BIGINT NOT NULL REFERENCES sb_products(id) ON DELETE CASCADE,
          qty INTEGER NOT NULL,
          unit_price BIGINT NOT NULL,
          line_total BIGINT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sb_invoice_lines_invoice_idx ON sb_invoice_lines (invoice_id);

        CREATE TABLE IF NOT EXISTS sb_payments (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          invoice_id BIGINT NOT NULL REFERENCES sb_invoices(id) ON DELETE CASCADE,
          amount BIGINT NOT NULL,
          method TEXT NOT NULL,
          paid_at TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sb_payments_lead_idx ON sb_payments (lead_id);

        CREATE TABLE IF NOT EXISTS sb_stock_moves (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          product_id BIGINT NOT NULL REFERENCES sb_products(id) ON DELETE CASCADE,
          qty INTEGER NOT NULL,
          kind TEXT NOT NULL,
          ref TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS sb_stock_moves_lead_idx ON sb_stock_moves (lead_id);

        -- What a customer actually did in their sandbox, for the team panel.
        CREATE TABLE IF NOT EXISTS demo_events (
          id BIGSERIAL PRIMARY KEY,
          lead_id UUID NOT NULL REFERENCES demo_leads(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS demo_events_lead_idx ON demo_events (lead_id);

        -- Layer 3: requests for a live session with a RAVAND expert.
        CREATE TABLE IF NOT EXISTS expert_requests (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          mobile TEXT NOT NULL,
          role TEXT,
          company_size TEXT NOT NULL,
          industry TEXT NOT NULL,
          needs TEXT,
          preferred_date DATE NOT NULL,
          preferred_slot TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          team_note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          notify_status TEXT
        );
        CREATE INDEX IF NOT EXISTS expert_requests_status_idx ON expert_requests (status);
        `
      )
      .then(() => undefined)
      .catch((err) => {
        // Let the next call retry instead of caching a failed bootstrap.
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}
