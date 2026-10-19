import { randomUUID } from "node:crypto";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Layer 3 of the demo: a request for a live session with a RAVAND
 * expert. The visitor proposes a day and a time window; the team calls
 * to confirm, then moves the request through its statuses in /team.
 */

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;
export const INDUSTRIES = ["manufacturing", "trading", "retail", "services", "healthcare", "fitness", "other"] as const;
export const SLOTS = ["morning", "midday", "afternoon"] as const;
export const REQUEST_STATUSES = ["new", "contacted", "scheduled", "done", "cancelled"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type ExpertRequest = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  role: string | null;
  companySize: string;
  industry: string;
  needs: string | null;
  preferredDate: string; // YYYY-MM-DD
  preferredSlot: string;
  status: RequestStatus;
  teamNote: string | null;
  createdAt: Date;
};

type Row = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  role: string | null;
  company_size: string;
  industry: string;
  needs: string | null;
  preferred_date: string;
  preferred_slot: string;
  status: RequestStatus;
  team_note: string | null;
  created_at: Date;
};

const fromRow = (r: Row): ExpertRequest => ({
  id: r.id,
  name: r.name,
  company: r.company,
  mobile: r.mobile,
  role: r.role,
  companySize: r.company_size,
  industry: r.industry,
  needs: r.needs,
  preferredDate: r.preferred_date,
  preferredSlot: r.preferred_slot,
  status: r.status,
  teamNote: r.team_note,
  createdAt: r.created_at,
});

/** Tehran's calendar date for `d`, as YYYY-MM-DD. */
export function tehranDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(d);
}

/**
 * A preferred date must be a working day (not Thursday or Friday, the
 * Iranian weekend) between tomorrow and four weeks out, in Tehran time.
 */
export function isBookableDate(iso: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const day = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(day.getTime())) return false;
  const today = new Date(`${tehranDate(now)}T12:00:00Z`);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const weekday = day.getUTCDay(); // 4 = Thu, 5 = Fri
  return diff >= 1 && diff <= 28 && weekday !== 4 && weekday !== 5;
}

export type ExpertRequestInput = Omit<ExpertRequest, "id" | "status" | "teamNote" | "createdAt">;

export async function createExpertRequest(input: ExpertRequestInput): Promise<ExpertRequest> {
  await ensureSchema();
  const res = await getPool().query<Row>(
    `INSERT INTO expert_requests
      (id, name, company, mobile, role, company_size, industry, needs, preferred_date, preferred_slot)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, name, company, mobile, role, company_size, industry, needs,
               to_char(preferred_date, 'YYYY-MM-DD') AS preferred_date, preferred_slot, status, team_note, created_at`,
    [
      randomUUID(),
      input.name,
      input.company,
      input.mobile,
      input.role,
      input.companySize,
      input.industry,
      input.needs,
      input.preferredDate,
      input.preferredSlot,
    ]
  );
  return fromRow(res.rows[0]);
}

export async function recordExpertNotify(id: string, status: string): Promise<void> {
  await getPool().query(`UPDATE expert_requests SET notify_status = $2 WHERE id = $1`, [id, status]);
}

export async function listExpertRequests(): Promise<ExpertRequest[]> {
  await ensureSchema();
  const res = await getPool().query<Row>(
    `SELECT id, name, company, mobile, role, company_size, industry, needs,
            to_char(preferred_date, 'YYYY-MM-DD') AS preferred_date, preferred_slot, status, team_note, created_at
     FROM expert_requests
     ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
              preferred_date, created_at DESC
     LIMIT 300`
  );
  return res.rows.map(fromRow);
}

export async function updateExpertRequest(id: string, status: RequestStatus, teamNote: string): Promise<void> {
  await getPool().query(`UPDATE expert_requests SET status = $2, team_note = $3 WHERE id = $1`, [
    id,
    status,
    teamNote || null,
  ]);
}
