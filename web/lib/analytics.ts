/**
 * Provider-agnostic event tracking scaffold. No vendor is wired today —
 * `track()` no-ops (only logging to the console in dev) until
 * `NEXT_PUBLIC_ANALYTICS_PROVIDER` is set, so this ships zero network
 * calls, no new CSP origin, and no consent requirement.
 *
 * To wire a real provider later: branch on
 * `process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER` inside `track()` and call
 * that provider's client — keep the call sites (below) unchanged.
 *
 * Event names are deliberately coarse and never carry free text: no name,
 * email, phone, or message content is ever passed as a prop, only ids
 * like which preset/industry/locale was involved.
 */

export type AnalyticsEvent =
  | "cta_click"
  | "demo_open"
  | "builder_start"
  | "builder_completion"
  | "contact_submit"
  | "industry_select"
  | "module_select"
  | "locale_switch"
  | "hero_cta_click"
  | "business_selected"
  | "modules_selected"
  | "workflow_configured"
  | "demo_completed"
  | "lead_submitted"
  | "contact_clicked";

type AnalyticsProps = Record<string, string | number | boolean>;

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  if (!provider) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics:noop]", event, props ?? {});
    }
    return;
  }

  // No provider is connected yet — this branch is unreachable until
  // NEXT_PUBLIC_ANALYTICS_PROVIDER is actually set to something.
}
