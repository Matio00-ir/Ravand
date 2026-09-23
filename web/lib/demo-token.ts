import { randomBytes, createHash, randomUUID } from "node:crypto";

/**
 * The private demo URL is a bearer capability: whoever holds the token can
 * open that customer's environment, no login involved (see docs/adr in the
 * PR description — this is a deliberate scope choice, not an oversight).
 * That makes the token itself the only secret, so it must be
 * cryptographically hard to guess and never recoverable from the database:
 * only its SHA-256 hash is stored, the same shape as an API-key table.
 */

/** 256 bits of entropy, URL-safe, ~43 characters. */
export function generateDemoToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDemoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateLeadId(): string {
  return randomUUID();
}

/** Trial length, configurable without a code change (see .env.example). */
export function demoTrialDays(): number {
  const raw = Number(process.env.DEMO_TRIAL_DAYS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 14;
}

export function computeExpiry(from: Date = new Date()): Date {
  const days = demoTrialDays();
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
