/**
 * Lead notification: tell the RAVAND team a demo was just created.
 *
 * Primary channel is SMS, email is only a fallback for the team's own
 * inbox — the customer is never asked for an email (see demoLeadSchema).
 * Both channels are optional and provider-agnostic: with no env vars set,
 * this module does nothing but log, and demo creation still succeeds.
 * Nothing here ever throws past its own try/catch — a notification
 * failure must never take down the lead/demo that was just persisted.
 */

export type NotifyResult = "sent" | "skipped" | "failed";

export type LeadNotification = {
  name: string;
  company: string;
  mobile: string;
  businessType: string;
  userCount: number;
  demoUrl: string;
};

function formatMessage(lead: LeadNotification): string {
  return [
    "RAVAND Lead",
    `Name: ${lead.name}`,
    `Company: ${lead.company}`,
    `Mobile: ${lead.mobile}`,
    `Business: ${lead.businessType}`,
    `Users: ${lead.userCount}`,
    `Demo: ${lead.demoUrl}`,
  ].join("\n");
}

/**
 * SMS via Kavenegar's plain REST API (https://kavenegar.com) — a common
 * Iranian provider with no SDK required, just a POST. `SMS_PROVIDER`
 * exists so a different provider can be swapped in later by adding a
 * branch here without touching any call site.
 */
async function sendSms(lead: LeadNotification): Promise<NotifyResult> {
  const provider = process.env.SMS_PROVIDER;
  if (!provider || provider === "none") return "skipped";

  const apiKey = process.env.SMS_API_KEY;
  const sender = process.env.SMS_SENDER_LINE;
  const recipient = process.env.NOTIFY_MOBILE;
  if (!apiKey || !sender || !recipient) return "skipped";

  try {
    if (provider === "kavenegar") {
      const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
      const body = new URLSearchParams({
        receptor: recipient,
        sender,
        message: formatMessage(lead),
      });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        console.error("[notifications] SMS send failed", res.status, await res.text().catch(() => ""));
        return "failed";
      }
      return "sent";
    }

    console.error(`[notifications] Unknown SMS_PROVIDER "${provider}"`);
    return "failed";
  } catch (err) {
    console.error("[notifications] SMS send threw", err);
    return "failed";
  }
}

/** SMTP fallback, only for the team's inbox — never the customer's. */
async function sendEmail(lead: LeadNotification): Promise<NotifyResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const to = process.env.NOTIFY_EMAIL;
  if (!host || !user || !pass || !from || !to) return "skipped";

  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
    await transport.sendMail({
      from,
      to,
      subject: `RAVAND lead — ${lead.company}`,
      text: formatMessage(lead),
    });
    return "sent";
  } catch (err) {
    console.error("[notifications] Email send threw", err);
    return "failed";
  }
}

/**
 * SMS first; only falls back to email when SMS was skipped (not
 * configured) or failed. Always resolves — the caller stores both
 * statuses on the lead row and moves on regardless of the outcome.
 */
export async function notifyTeam(
  lead: LeadNotification
): Promise<{ sms: NotifyResult; email: NotifyResult }> {
  const sms = await sendSms(lead);
  const email = sms === "sent" ? "skipped" : await sendEmail(lead);
  return { sms, email };
}
