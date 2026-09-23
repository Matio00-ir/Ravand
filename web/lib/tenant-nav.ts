import { type ModuleKey } from "@/components/system/ModuleIcon";
import { type DemoLead } from "@/lib/demo-leads";

export type TenantNavItem = { key: ModuleKey | "overview"; path: string; live: boolean };

/**
 * Builds this tenant's own nav rail from what they actually picked in the
 * builder: modules they didn't select are left out entirely (per item 14
 * of the brief — "the dashboard should reflect those modules"), modules
 * they picked but aren't built yet show up as "soon" instead of live, and
 * Production is the one deep, real module — surfaced for manufacturing
 * regardless of the module toggles, since it's the flagship use case
 * rather than a checkbox item.
 */
export function buildTenantNav(lead: DemoLead): TenantNavItem[] {
  const has = (m: ModuleKey) => lead.modules.includes(m);
  const items: TenantNavItem[] = [{ key: "overview", path: "", live: true }];

  if (has("finance")) items.push({ key: "finance", path: "/finance", live: true });
  if (has("sales")) items.push({ key: "sales", path: "/sales", live: true });
  if (lead.businessType === "manufacturing") {
    items.push({ key: "production", path: "/production", live: true });
  }

  const soonCandidates: ModuleKey[] = ["crm", "inventory", "workflow", "hr", "analytics"];
  for (const key of soonCandidates) {
    if (has(key)) items.push({ key, path: "", live: false });
  }

  return items;
}
