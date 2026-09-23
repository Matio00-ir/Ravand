import { cache } from "react";
import { ensureSchema, getPool } from "@/lib/db";
import { generateDemoToken, generateLeadId, hashDemoToken, computeExpiry } from "@/lib/demo-token";
import { type ModuleKey } from "@/components/system/ModuleIcon";

export type DemoLeadStatus = "active" | "expired" | "disabled";

export type DemoLead = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  businessType: string;
  userCount: number;
  modules: ModuleKey[];
  workflow: string[];
  status: DemoLeadStatus;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date | null;
  accessCount: number;
};

type Row = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  business_type: string;
  user_count: number;
  modules: ModuleKey[];
  workflow: string[];
  status: DemoLeadStatus;
  created_at: Date;
  expires_at: Date;
  last_accessed_at: Date | null;
  access_count: number;
};

function fromRow(row: Row): DemoLead {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    mobile: row.mobile,
    businessType: row.business_type,
    userCount: row.user_count,
    modules: row.modules,
    workflow: row.workflow,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastAccessedAt: row.last_accessed_at,
    accessCount: row.access_count,
  };
}

export type CreateLeadInput = {
  name: string;
  company: string;
  mobile: string;
  businessType: string;
  userCount: number;
  modules: ModuleKey[];
  workflow: string[];
};

/**
 * Creates a new demo lead, or — if this mobile number already has an
 * active, unexpired demo — rotates that existing row's access token
 * instead of creating a duplicate. The plaintext token is only ever known
 * for the instant it's generated (only its hash is persisted), so
 * "resend my link" has to mean "mint a new token for my existing row",
 * not "look up the old one." created_at/expires_at are left untouched on
 * a rotation: resubmitting the form doesn't extend the trial.
 *
 * Returns the plaintext token — the only time it will ever be available.
 */
export async function upsertDemoLead(
  input: CreateLeadInput
): Promise<{ token: string; lead: DemoLead; isNew: boolean }> {
  await ensureSchema();
  const pool = getPool();
  const token = generateDemoToken();
  const tokenHash = hashDemoToken(token);

  const existing = await pool.query<Row>(
    `UPDATE demo_leads
     SET token_hash = $1
     WHERE mobile = $2 AND status = 'active' AND expires_at > now()
     RETURNING *`,
    [tokenHash, input.mobile]
  );

  if (existing.rows.length > 0) {
    return { token, lead: fromRow(existing.rows[0]), isNew: false };
  }

  const id = generateLeadId();
  const createdAt = new Date();
  const expiresAt = computeExpiry(createdAt);

  const inserted = await pool.query<Row>(
    `INSERT INTO demo_leads
      (id, token_hash, name, company, mobile, business_type, user_count, modules, workflow, config, status, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, $12)
     RETURNING *`,
    [
      id,
      tokenHash,
      input.name,
      input.company,
      input.mobile,
      input.businessType,
      input.userCount,
      JSON.stringify(input.modules),
      JSON.stringify(input.workflow),
      JSON.stringify({ businessType: input.businessType, modules: input.modules, workflow: input.workflow }),
      createdAt.toISOString(),
      expiresAt.toISOString(),
    ]
  );

  return { token, lead: fromRow(inserted.rows[0]), isNew: true };
}

export async function recordNotificationResult(
  leadId: string,
  result: { sms: string; email: string; error?: string }
): Promise<void> {
  await getPool().query(
    `UPDATE demo_leads SET notify_sms_status = $2, notify_email_status = $3, notify_error = $4 WHERE id = $1`,
    [leadId, result.sms, result.email, result.error ?? null]
  );
}

/**
 * Looked up once per request via React's `cache()`: the layout resolves
 * and gates the token, the page renders from the same result, and the
 * database is only hit once even though both call this.
 */
export const getLeadByToken = cache(async (token: string): Promise<DemoLead | null> => {
  await ensureSchema();
  const tokenHash = hashDemoToken(token);
  const res = await getPool().query<Row>(`SELECT * FROM demo_leads WHERE token_hash = $1`, [tokenHash]);
  if (res.rows.length === 0) return null;
  return fromRow(res.rows[0]);
});

/** Best-effort visit tracking — never blocks or fails the page render. */
export async function touchAccess(id: string): Promise<void> {
  try {
    await getPool().query(
      `UPDATE demo_leads SET last_accessed_at = now(), access_count = access_count + 1 WHERE id = $1`,
      [id]
    );
  } catch (err) {
    console.error("[demo-leads] touchAccess failed", err);
  }
}

export function isExpired(lead: DemoLead): boolean {
  return lead.status === "expired" || lead.expiresAt.getTime() <= Date.now();
}

export function isBlocked(lead: DemoLead): boolean {
  return lead.status === "disabled";
}

export function daysRemaining(lead: DemoLead): number {
  const ms = lead.expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
