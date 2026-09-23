"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  contactSchema,
  demoLeadSchema,
  looksLikeAbuse,
  payloadTooLarge,
  validateFields,
  type FieldErrors,
} from "@/lib/validation";
import { upsertDemoLead, recordNotificationResult } from "@/lib/demo-leads";
import { notifyTeam } from "@/lib/notifications";
import { SITE_URL } from "@/lib/site";
import { type ModuleKey } from "@/components/system/ModuleIcon";

export type FormState = {
  status: "idle" | "success" | "error";
  errors: FieldErrors;
};

const initialAbuseResponse: FormState = { status: "success", errors: {} };

/**
 * The Contact form: real server-side validation, a honeypot + timing
 * check, and a payload-size cap. Not wired to a delivery system — see
 * pages.contact.form.note, which says so honestly in the UI.
 */
export async function submitContactForm(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (payloadTooLarge(formData) || looksLikeAbuse(formData)) {
    return initialAbuseResponse;
  }

  const { errors } = validateFields(formData, contactSchema);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  return { status: "success", errors: {} };
}

const KNOWN_BUSINESS_TYPES = ["manufacturing", "trading", "services", "retail"] as const;
const KNOWN_MODULES: readonly ModuleKey[] = [
  "erp",
  "crm",
  "finance",
  "inventory",
  "sales",
  "workflow",
  "hr",
  "analytics",
];

/**
 * The builder's final step. Unlike the old submitDemoForm, this doesn't
 * just validate and say "success" — it actually persists the lead,
 * creates a private demo, notifies the RAVAND team, and redirects the
 * visitor straight into the environment they just configured. See
 * lib/demo-leads.ts for the persistence/token model and
 * lib/notifications.ts for the SMS-then-email fallback.
 *
 * `redirect()` throws a Next.js control-flow exception on success, so
 * nothing after a successful redirect ever executes — callers only ever
 * see this return for the error path.
 */
export async function createDemoLead(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (payloadTooLarge(formData) || looksLikeAbuse(formData)) {
    return initialAbuseResponse;
  }

  const { values, errors } = validateFields(formData, demoLeadSchema);

  const businessType = String(formData.get("businessType") ?? "");
  if (!KNOWN_BUSINESS_TYPES.includes(businessType as (typeof KNOWN_BUSINESS_TYPES)[number])) {
    errors.businessType = "invalid";
  }

  let modules: ModuleKey[] = [];
  try {
    const raw = JSON.parse(String(formData.get("modules") ?? "[]"));
    if (!Array.isArray(raw) || raw.length === 0 || !raw.every((m) => KNOWN_MODULES.includes(m))) {
      throw new Error("invalid modules");
    }
    modules = raw;
  } catch {
    errors.modules = "invalid";
  }

  let workflow: string[] = [];
  try {
    const raw = JSON.parse(String(formData.get("workflow") ?? "[]"));
    if (
      !Array.isArray(raw) ||
      raw.length === 0 ||
      !raw.every((s) => typeof s === "string" && s.trim().length > 0 && s.length <= 80)
    ) {
      throw new Error("invalid workflow");
    }
    workflow = raw.map((s: string) => s.trim());
  } catch {
    errors.workflow = "invalid";
  }

  const userCount = Number(formData.get("userCount"));
  if (!Number.isFinite(userCount) || userCount < 1 || userCount > 999) {
    errors.userCount = "invalid";
  }

  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  const { token, lead, isNew } = await upsertDemoLead({
    name: values.name,
    company: values.company,
    mobile: values.mobile,
    businessType,
    userCount: Math.round(userCount),
    modules,
    workflow,
  });

  const locale = await getLocale();
  const demoPath = locale === "en" ? `/en/demo/${token}` : `/demo/${token}`;

  if (isNew) {
    const demoUrl = `${SITE_URL}${demoPath}`;
    try {
      const result = await notifyTeam({
        name: lead.name,
        company: lead.company,
        mobile: lead.mobile,
        businessType: lead.businessType,
        userCount: lead.userCount,
        demoUrl,
      });
      await recordNotificationResult(lead.id, result);
    } catch (err) {
      // Notification failure must never take down a demo that was
      // already created and persisted — log and keep going.
      console.error("[createDemoLead] notification failed", err);
      await recordNotificationResult(lead.id, {
        sms: "failed",
        email: "failed",
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => undefined);
    }
  }

  redirect(demoPath);
}
