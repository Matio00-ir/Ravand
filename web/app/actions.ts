"use server";

import {
  contactSchema,
  demoSchema,
  looksLikeAbuse,
  payloadTooLarge,
  validateFields,
  type FieldErrors,
} from "@/lib/validation";

export type FormState = {
  status: "idle" | "success" | "error";
  errors: FieldErrors;
};

const initialAbuseResponse: FormState = { status: "success", errors: {} };

/**
 * Both actions share one shape: real server-side validation (never trust
 * the client), a honeypot + timing check, and a payload-size cap. Neither
 * is wired to a delivery system yet — same honest behavior the UI already
 * had, now backed by a real server-side pass instead of only `preventDefault`
 * on the client. See lib/validation.ts for the actual rules.
 *
 * A caught abuse signal (honeypot filled, submitted too fast/stale, or an
 * oversized payload) returns the same "success" shape a real submission
 * would — this silently drops the request instead of telling an automated
 * client what tripped the check.
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

export async function submitDemoForm(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (payloadTooLarge(formData) || looksLikeAbuse(formData)) {
    return initialAbuseResponse;
  }

  const { errors } = validateFields(formData, demoSchema);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  return { status: "success", errors: {} };
}
