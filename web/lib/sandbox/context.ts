import { cache } from "react";
import { getLeadByToken, isBlocked, isExpired, type DemoLead } from "@/lib/demo-leads";
import { ensureSeeded, loadSnapshot, type Snapshot } from "@/lib/sandbox/store";

/**
 * What every /demo/[token] page needs: the lead and its seeded sandbox.
 * Layouts and pages render in parallel, so a page can't rely on the
 * layout having seeded first — each one goes through here, and React's
 * `cache()` makes the lookup and the seed check happen once per request.
 * Returns null for a token the layout will refuse anyway.
 */
const seeded = cache((leadId: string, businessType: string, locale: string) =>
  ensureSeeded(leadId, businessType, locale)
);

export const loadDemo = cache(
  async (token: string, locale: string): Promise<{ lead: DemoLead; snapshot: Snapshot } | null> => {
    const lead = await getLeadByToken(token);
    if (!lead || isBlocked(lead) || isExpired(lead)) return null;
    await seeded(lead.id, lead.businessType, locale);
    return { lead, snapshot: await loadSnapshot(lead.id) };
  }
);

export async function loadLead(token: string, locale: string): Promise<DemoLead | null> {
  const lead = await getLeadByToken(token);
  if (!lead || isBlocked(lead) || isExpired(lead)) return null;
  await seeded(lead.id, lead.businessType, locale);
  return lead;
}
