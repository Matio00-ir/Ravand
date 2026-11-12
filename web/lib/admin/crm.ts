import { cache } from "react";
import { q, q1 } from "@/lib/admin/schema";

/**
 * Sales pipeline data. Every lead the website captures becomes an
 * opportunity ("deal") here automatically: a private demo enters at the
 * "demo" stage, an expert-session request either joins that person's
 * open deal (same mobile) or opens a new one. Contact-form messages stay
 * in the inbox until someone decides they're a sale.
 */

export type Deal = {
  id: number;
  title: string;
  company: string | null;
  contact_name: string | null;
  mobile: string | null;
  email: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  stage: string;
  value: number;
  expected_close: string | null;
  owner_id: string | null;
  owner_name: string | null;
  customer_id: number | null;
  customer_name: string | null;
  demo_lead_id: string | null;
  expert_request_id: string | null;
  lost_reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
  open_tasks: number;
};

const DEAL_SELECT = `
  SELECT d.*, u.name AS owner_name, c.name AS customer_name,
         (SELECT count(*)::int FROM adm_tasks t WHERE t.entity = 'deal' AND t.entity_id = d.id::text AND NOT t.done) AS open_tasks
  FROM adm_deals d
  LEFT JOIN adm_users u ON u.id = d.owner_id
  LEFT JOIN adm_customers c ON c.id = d.customer_id`;

/** Pull new demo leads and expert requests into the pipeline. Idempotent. */
export const syncInbound = cache(async (): Promise<void> => {
  await q(
    `INSERT INTO adm_deals (title, company, contact_name, mobile, source, stage, demo_lead_id,
                            utm_source, utm_medium, utm_campaign, notes, created_at, updated_at)
     SELECT 'دموی ' || l.company, l.company, l.name, l.mobile, 'demo', 'demo', l.id,
            l.utm->>'source', l.utm->>'medium', l.utm->>'campaign',
            'نوع کسب‌وکار: ' || l.business_type || ' · ' || l.user_count || ' کاربر · ماژول‌ها: ' ||
              (SELECT string_agg(m, '، ') FROM jsonb_array_elements_text(l.modules) m),
            l.created_at, l.created_at
     FROM demo_leads l
     WHERE NOT EXISTS (SELECT 1 FROM adm_deals d WHERE d.demo_lead_id = l.id)
     ON CONFLICT (demo_lead_id) DO NOTHING`
  );

  // A session request from someone already in the pipeline joins their deal.
  await q(
    `UPDATE adm_deals d
     SET expert_request_id = m.request_id,
         stage = CASE WHEN d.stage IN ('new', 'contacted') THEN 'demo' ELSE d.stage END,
         updated_at = now()
     FROM (
       -- One deal per request (their newest open deal), then one request per deal.
       SELECT DISTINCT ON (deal_id) deal_id, request_id
       FROM (
         SELECT DISTINCT ON (r.id) r.id AS request_id, dd.id AS deal_id, r.created_at
         FROM expert_requests r
         JOIN adm_deals dd ON dd.mobile = r.mobile AND dd.expert_request_id IS NULL AND dd.stage NOT IN ('won', 'lost')
         WHERE NOT EXISTS (SELECT 1 FROM adm_deals x WHERE x.expert_request_id = r.id)
         ORDER BY r.id, dd.created_at DESC
       ) per_request
       ORDER BY deal_id, created_at
     ) m
     WHERE d.id = m.deal_id`
  );

  await q(
    `INSERT INTO adm_deals (title, company, contact_name, mobile, source, stage, expert_request_id,
                            utm_source, utm_medium, utm_campaign, notes, created_at, updated_at)
     SELECT 'جلسه با کارشناس — ' || r.company, r.company, r.name, r.mobile, 'expert', 'demo', r.id,
            r.utm->>'source', r.utm->>'medium', r.utm->>'campaign',
            concat_ws(' · ', 'پرسنل: ' || r.company_size, 'حوزه: ' || r.industry, 'زمان پیشنهادی: ' || r.preferred_date || ' ' || r.preferred_slot, r.needs),
            r.created_at, r.created_at
     FROM expert_requests r
     WHERE NOT EXISTS (SELECT 1 FROM adm_deals d WHERE d.expert_request_id = r.id)
     ON CONFLICT (expert_request_id) DO NOTHING`
  );
});

export async function listDeals(where = "TRUE", params: unknown[] = []): Promise<Deal[]> {
  await syncInbound();
  return q<Deal>(`${DEAL_SELECT} WHERE ${where} ORDER BY d.updated_at DESC LIMIT 500`, params);
}

export async function getDeal(id: number): Promise<Deal | null> {
  await syncInbound();
  return q1<Deal>(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
}

export type Activity = { id: number; kind: string; body: string; created_at: Date; user_name: string | null };

export function listActivities(entity: string, entityId: string | number): Promise<Activity[]> {
  return q<Activity>(
    `SELECT a.id, a.kind, a.body, a.created_at, u.name AS user_name
     FROM adm_activities a LEFT JOIN adm_users u ON u.id = a.created_by
     WHERE a.entity = $1 AND a.entity_id = $2 ORDER BY a.created_at DESC LIMIT 200`,
    [entity, String(entityId)]
  );
}

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: string;
  done: boolean;
  done_at: Date | null;
  assignee_id: string | null;
  assignee_name: string | null;
  entity: string | null;
  entity_id: string | null;
  entity_label: string | null;
  created_at: Date;
};

/** Tasks with a human label for whatever they're attached to. */
export function listTasks(where = "TRUE", params: unknown[] = []): Promise<Task[]> {
  return q<Task>(
    `SELECT t.*, u.name AS assignee_name,
       CASE t.entity
         WHEN 'deal' THEN (SELECT title FROM adm_deals WHERE id::text = t.entity_id)
         WHEN 'customer' THEN (SELECT name FROM adm_customers WHERE id::text = t.entity_id)
         WHEN 'project' THEN (SELECT title FROM adm_projects WHERE id::text = t.entity_id)
         WHEN 'ticket' THEN (SELECT number || ' — ' || subject FROM adm_tickets WHERE id::text = t.entity_id)
       END AS entity_label
     FROM adm_tasks t LEFT JOIN adm_users u ON u.id = t.assignee_id
     WHERE ${where}
     ORDER BY t.done, t.due_date NULLS LAST, t.created_at DESC
     LIMIT 500`,
    params
  );
}

export type UserOption = { id: string; name: string };

export function listUsers(): Promise<UserOption[]> {
  return q<UserOption>(`SELECT id, name FROM adm_users WHERE active ORDER BY name`);
}

/** Demo leads with what each customer did in their sandbox. */
export type DemoRow = {
  id: string;
  name: string;
  company: string;
  mobile: string;
  business_type: string;
  user_count: number;
  status: string;
  created_at: Date;
  expires_at: Date;
  last_accessed_at: Date | null;
  access_count: number;
  actions: number;
  invoices: number;
  deal_id: number | null;
  deal_stage: string | null;
};

export async function listDemos(): Promise<DemoRow[]> {
  await syncInbound();
  return q<DemoRow>(
    `SELECT l.id, l.name, l.company, l.mobile, l.business_type, l.user_count, l.status, l.created_at, l.expires_at,
            l.last_accessed_at, l.access_count,
            (SELECT count(*)::int FROM demo_events e WHERE e.lead_id = l.id AND e.kind <> 'sandbox.reset') AS actions,
            (SELECT count(*)::int FROM demo_events e WHERE e.lead_id = l.id AND e.kind = 'invoice.create') AS invoices,
            d.id AS deal_id, d.stage AS deal_stage
     FROM demo_leads l LEFT JOIN adm_deals d ON d.demo_lead_id = l.id
     ORDER BY l.created_at DESC LIMIT 500`
  );
}

export type ContactMessage = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: Date;
  deal_id: number | null;
};

export function listMessages(where = "TRUE"): Promise<ContactMessage[]> {
  return q<ContactMessage>(
    `SELECT m.*, d.id AS deal_id FROM contact_messages m LEFT JOIN adm_deals d ON d.contact_message_id = m.id
     WHERE ${where} ORDER BY m.created_at DESC LIMIT 300`
  );
}
