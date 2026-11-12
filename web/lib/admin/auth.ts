import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q, q1 } from "@/lib/admin/schema";

/**
 * Accounts for the admin panel. Real per-person accounts (scrypt-hashed
 * passwords, server-side sessions) so more staff can be added later with
 * their own role. The very first account is created from ADMIN_USERNAME /
 * ADMIN_PASSWORD on the first matching login; after that the env values
 * are ignored and passwords are managed in the panel.
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "ravand_admin";
const SESSION_DAYS = 7;

export type Role = "owner" | "manager" | "sales" | "finance" | "support";
export const ROLES: Role[] = ["owner", "manager", "sales", "finance", "support"];

export type Area = "dashboard" | "crm" | "customers" | "finance" | "projects" | "support" | "marketing" | "settings";

/** Which roles may open each area of the panel. The owner sees everything. */
const ACCESS: Record<Area, Role[]> = {
  dashboard: ["owner", "manager", "sales", "finance", "support"],
  crm: ["owner", "manager", "sales"],
  customers: ["owner", "manager", "sales", "finance", "support"],
  finance: ["owner", "manager", "finance"],
  projects: ["owner", "manager", "support"],
  support: ["owner", "manager", "support"],
  marketing: ["owner", "manager", "sales"],
  settings: ["owner"],
};

export function can(role: Role, area: Area): boolean {
  return ACCESS[area].includes(role);
}

export type AdminUser = { id: string; username: string; name: string; role: Role };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

export type LoginResult = { ok: true } | { ok: false; reason: "invalid" | "locked" | "setup" };

/**
 * Checks credentials, enforcing a lockout after repeated failures for the
 * same username, and on success opens a session (cookie + DB row).
 */
export async function login(usernameRaw: string, password: string): Promise<LoginResult> {
  const username = usernameRaw.trim().toLowerCase();
  const recent = await q1<{ c: number }>(
    `SELECT count(*)::int AS c FROM adm_login_failures WHERE username = $1 AND at > now() - make_interval(mins => $2)`,
    [username, LOCK_MINUTES]
  );
  if ((recent?.c ?? 0) >= MAX_FAILURES) return { ok: false, reason: "locked" };

  let user = await q1<{ id: string; password_hash: string; active: boolean }>(
    `SELECT id, password_hash, active FROM adm_users WHERE username = $1`,
    [username]
  );

  // First-run bootstrap: no accounts yet → the env credentials create the owner.
  if (!user) {
    const count = await q1<{ c: number }>(`SELECT count(*)::int AS c FROM adm_users`);
    if ((count?.c ?? 0) === 0) {
      const envUser = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
      const envPass = process.env.ADMIN_PASSWORD ?? "";
      if (!envUser || envPass.length < 8) return { ok: false, reason: "setup" };
      if (envUser === username && safeEqual(password, envPass)) {
        const id = randomUUID();
        await q(`INSERT INTO adm_users (id, username, name, password_hash, role) VALUES ($1, $2, $3, $4, 'owner')`, [
          id,
          username,
          "مدیر روند",
          await hashPassword(password),
        ]);
        user = { id, password_hash: "", active: true };
        await openSession(id);
        return { ok: true };
      }
    }
  }

  if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) {
    await q(`INSERT INTO adm_login_failures (username) VALUES ($1)`, [username]);
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, reason: "invalid" };
  }

  await q(`DELETE FROM adm_login_failures WHERE username = $1`, [username]);
  await openSession(user.id);
  return { ok: true };
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));
}

async function openSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await q(`INSERT INTO adm_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`, [
    sha256(token),
    userId,
    SESSION_DAYS,
  ]);
  await q(`UPDATE adm_users SET last_login_at = now() WHERE id = $1`, [userId]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await q(`DELETE FROM adm_sessions WHERE token_hash = $1`, [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await q1<AdminUser & { active: boolean }>(
    `SELECT u.id, u.username, u.name, u.role, u.active
     FROM adm_sessions s JOIN adm_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)]
  );
  if (!row || !row.active) return null;
  return { id: row.id, username: row.username, name: row.name, role: row.role };
});

/** For pages: the user, or a redirect to login / the dashboard if not allowed. */
export async function requirePage(area: Area): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, area)) redirect("/admin");
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function requireAction(area: Area): Promise<AdminUser> {
  const user = await currentUser();
  if (!user || !can(user.role, area)) throw new AdminError("forbidden");
  return user;
}

export class AdminError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  const row = await q1<{ password_hash: string }>(`SELECT password_hash FROM adm_users WHERE id = $1`, [userId]);
  if (!row || !(await verifyPassword(current, row.password_hash))) return false;
  await q(`UPDATE adm_users SET password_hash = $2 WHERE id = $1`, [userId, await hashPassword(next)]);
  // Sign out every other session for this user.
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await q(`DELETE FROM adm_sessions WHERE user_id = $1 AND token_hash <> $2`, [userId, sha256(token)]);
  return true;
}
