"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  contactSchema,
  demoLeadSchema,
  expertRequestSchema,
  looksLikeAbuse,
  payloadTooLarge,
  validateFields,
  type FieldErrors,
} from "@/lib/validation";
import { upsertDemoLead, recordNotificationResult } from "@/lib/demo-leads";
import { notifyTeam, notifyTeamMessage } from "@/lib/notifications";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  SLOTS,
  createExpertRequest,
  isBookableDate,
  recordExpertNotify,
} from "@/lib/expert-requests";
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

  let created: Awaited<ReturnType<typeof upsertDemoLead>>;
  try {
    created = await upsertDemoLead({
      name: values.name,
      company: values.company,
      mobile: values.mobile,
      businessType,
      userCount: Math.round(userCount),
      modules,
      workflow,
    });
  } catch (err) {
    // A missing DATABASE_URL or unreachable Postgres must surface as a
    // form error, not crash the whole page with a server error screen.
    console.error("[createDemoLead] persisting lead failed", err);
    return { status: "error", errors: { form: "server" } };
  }
  const { token, lead, isNew } = created;

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

/**
 * Layer 3: a request for a live session with a RAVAND expert. Persisted
 * first, then the team is paged (SMS, email fallback) — the same
 * "never lose the lead to a notification failure" order as above. The
 * success state carries no data back; the form shows a confirmation.
 */
export async function requestExpertDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  if (payloadTooLarge(formData) || looksLikeAbuse(formData)) {
    return initialAbuseResponse;
  }

  const { values, errors } = validateFields(formData, expertRequestSchema);
  if (!COMPANY_SIZES.includes(values.companySize as (typeof COMPANY_SIZES)[number])) errors.companySize = "required";
  if (!INDUSTRIES.includes(values.industry as (typeof INDUSTRIES)[number])) errors.industry = "required";
  if (!SLOTS.includes(values.preferredSlot as (typeof SLOTS)[number])) errors.preferredSlot = "required";
  if (!isBookableDate(values.preferredDate)) errors.preferredDate = values.preferredDate ? "invalid" : "required";

  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  let request: Awaited<ReturnType<typeof createExpertRequest>>;
  try {
    request = await createExpertRequest({
      name: values.name,
      company: values.company,
      mobile: values.mobile,
      role: values.role || null,
      companySize: values.companySize,
      industry: values.industry,
      needs: values.needs || null,
      preferredDate: values.preferredDate,
      preferredSlot: values.preferredSlot,
    });
  } catch (err) {
    console.error("[requestExpertDemo] persisting request failed", err);
    return { status: "error", errors: { form: "server" } };
  }

  try {
    const message = [
      "RAVAND expert session request",
      `Name: ${request.name}${request.role ? ` (${request.role})` : ""}`,
      `Company: ${request.company} — ${request.companySize} staff, ${request.industry}`,
      `Mobile: ${request.mobile}`,
      `Preferred: ${request.preferredDate} ${request.preferredSlot}`,
      request.needs ? `Needs: ${request.needs}` : "",
      `Panel: ${SITE_URL}/team`,
    ]
      .filter(Boolean)
      .join("\n");
    const result = await notifyTeamMessage(`RAVAND expert session — ${request.company}`, message);
    await recordExpertNotify(request.id, `sms:${result.sms} email:${result.email}`);
  } catch (err) {
    console.error("[requestExpertDemo] notification failed", err);
  }

  return { status: "success", errors: {} };
}
