import { type ModuleKey } from "@/components/system/ModuleIcon";
import { type DemoLead } from "@/lib/demo-leads";

export type TenantNavItem = { key: ModuleKey | "overview"; path: string; live: boolean; sample?: boolean };

/**
 * Builds this tenant's nav rail. The working core of the sandbox —
 * sales invoices, customers, inventory and finance — is always present,
 * because each depends on the others (an invoice needs a customer and
 * products, and drives stock and receivables). Beyond that core, the
 * rail reflects what the customer picked in the builder; those screens
 * still show sample data and are flagged `sample` so the rail says so.
 * Production is surfaced for manufacturing, as the flagship use case.
 */
export function buildTenantNav(lead: DemoLead): TenantNavItem[] {
  const has = (m: ModuleKey) => lead.modules.includes(m);
  const items: TenantNavItem[] = [
    { key: "overview", path: "", live: true },
    { key: "sales", path: "/sales", live: true },
    { key: "crm", path: "/crm", live: true },
    { key: "inventory", path: "/inventory", live: true },
    { key: "finance", path: "/finance", live: true },
  ];

  if (lead.businessType === "manufacturing") {
    items.push({ key: "production", path: "/production", live: true });
  }

  const sampleScreens: ModuleKey[] = ["workflow", "hr", "analytics"];
  for (const key of sampleScreens) {
    if (has(key)) items.push({ key, path: `/${key}`, live: true, sample: true });
  }

  return items;
}
