import { ensureSchema, getPool } from "@/lib/db";
import { type DemoLeadStatus } from "@/lib/demo-leads";

/**
 * Read models for the team panel: every demo lead with what the customer
 * actually did in their sandbox, so the team can call the engaged ones
 * first.
 */

export type LeadRow = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  businessType: string;
  userCount: number;
  status: DemoLeadStatus;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date | null;
  accessCount: number;
  actions: number;
  invoicesIssued: number;
  lastActionAt: Date | null;
  notify: string | null;
  teamNote: string | null;
};

export async function listLeads(): Promise<LeadRow[]> {
  await ensureSchema();
  const res = await getPool().query<{
    id: string;
    name: string;
    company: string;
    mobile: string;
    business_type: string;
    user_count: number;
    status: DemoLeadStatus;
    created_at: Date;
    expires_at: Date;
    last_accessed_at: Date | null;
    access_count: number;
    actions: string;
    invoices: string;
    last_action: Date | null;
    notify_sms_status: string | null;
    notify_email_status: string | null;
    team_note: string | null;
  }>(
    `SELECT l.id, l.name, l.company, l.mobile, l.business_type, l.user_count, l.status,
            l.created_at, l.expires_at, l.last_accessed_at, l.access_count,
            l.notify_sms_status, l.notify_email_status, l.team_note,
            COUNT(e.id) FILTER (WHERE e.kind <> 'sandbox.reset') AS actions,
            COUNT(e.id) FILTER (WHERE e.kind = 'invoice.create') AS invoices,
            MAX(e.created_at) AS last_action
     FROM demo_leads l
     LEFT JOIN demo_events e ON e.lead_id = l.id
     GROUP BY l.id
     ORDER BY l.created_at DESC
     LIMIT 500`
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    mobile: r.mobile,
    businessType: r.business_type,
    userCount: r.user_count,
    status: r.status,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    lastAccessedAt: r.last_accessed_at,
    accessCount: r.access_count,
    actions: Number(r.actions),
    invoicesIssued: Number(r.invoices),
    lastActionAt: r.last_action,
    notify: r.notify_sms_status ? `SMS ${r.notify_sms_status} · Email ${r.notify_email_status ?? "—"}` : null,
    teamNote: r.team_note,
  }));
}

export async function extendLead(id: string, days: number): Promise<void> {
  await getPool().query(
    `UPDATE demo_leads
     SET expires_at = GREATEST(expires_at, now()) + make_interval(days => $2),
         status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
     WHERE id = $1`,
    [id, days]
  );
}

export async function setLeadStatus(id: string, status: "active" | "disabled"): Promise<void> {
  await getPool().query(`UPDATE demo_leads SET status = $2 WHERE id = $1`, [id, status]);
}

export async function setLeadNote(id: string, note: string): Promise<void> {
  await getPool().query(`UPDATE demo_leads SET team_note = $2 WHERE id = $1`, [id, note || null]);
}

/** Whole days from now until `d` (negative once past). */
export function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
