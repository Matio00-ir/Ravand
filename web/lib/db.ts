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
