import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Access to /team, the sales team's panel. One shared password from
 * TEAM_PANEL_PASSWORD (no user accounts — a small team, one panel). A
 * successful login sets an httpOnly cookie holding an HMAC of its issue
 * time keyed by that password, so changing the password signs everyone
 * out, and nothing secret is ever stored in the cookie itself.
 * With the variable unset the panel is disabled entirely.
 */

export const TEAM_COOKIE = "ravand_team";
const MAX_AGE_S = 12 * 60 * 60;

function secret(): string | null {
  const pw = process.env.TEAM_PANEL_PASSWORD;
  return pw && pw.length >= 8 ? pw : null;
}

export function teamPanelEnabled(): boolean {
  return secret() !== null;
}

function sign(issuedAt: string, key: string): string {
  return createHmac("sha256", key).update(`ravand-team-v1:${issuedAt}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so lengths always match and nothing leaks through timing.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  const key = secret();
  return key !== null && safeEqual(candidate, key);
}

export function issueSession(): { value: string; maxAge: number } {
  const key = secret();
  if (!key) throw new Error("Team panel is disabled");
  const issuedAt = String(Math.floor(Date.now() / 1000));
  return { value: `${issuedAt}.${sign(issuedAt, key)}`, maxAge: MAX_AGE_S };
}

export async function isTeamSession(): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const raw = (await cookies()).get(TEAM_COOKIE)?.value;
  if (!raw) return false;
  const [issuedAt, sig] = raw.split(".");
  if (!issuedAt || !sig || !/^\d+$/.test(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < 0 || age > MAX_AGE_S) return false;
  return safeEqual(sig, sign(issuedAt, key));
}
