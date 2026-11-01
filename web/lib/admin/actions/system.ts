"use server";

import { randomUUID } from "node:crypto";
import { FieldErrors, act, actForm, idFrom, ok, parse, type AdminState } from "@/lib/admin/act";
import { AdminError, changePassword, hashPassword } from "@/lib/admin/auth";
import { announcementFields, campaignFields, companyFields, passwordFields, userFields } from "@/lib/admin/defs";
import { v } from "@/lib/admin/fields";
import { q, q1 } from "@/lib/admin/schema";
import { setSetting } from "@/lib/admin/settings";

/* ---------------- marketing ---------------- */

export async function saveCampaign(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("marketing", async () => {
    const vals = parse(fd, campaignFields);
    const utm = v.s(vals, "utm_campaign")?.toLowerCase().replace(/\s+/g, "-") ?? null;
    if (utm && !/^[a-z0-9._-]{1,80}$/.test(utm)) throw new FieldErrors({ utm_campaign: "invalid" });
    const params = [v.s(vals, "name"), v.s(vals, "channel"), utm, v.n(vals, "budget"), v.n(vals, "spent"), v.s(vals, "start_date"), v.s(vals, "end_date"), v.s(vals, "notes")];
    const id = Number(fd.get("id")) || null;
    try {
      if (id) {
        await q(`UPDATE adm_campaigns SET name = $1, channel = $2, utm_campaign = $3, budget = $4, spent = $5, start_date = $6, end_date = $7, notes = $8 WHERE id = $9`, [...params, id]);
      } else {
        await q(`INSERT INTO adm_campaigns (name, channel, utm_campaign, budget, spent, start_date, end_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, params);
      }
    } catch (err) {
      if ((err as { code?: string }).code === "23505") throw new FieldErrors({ utm_campaign: "invalid" });
      throw err;
    }
    return ok(id ? "ذخیره شد." : "کمپین اضافه شد.");
  });
}

export async function deleteCampaign(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("marketing", async () => {
    await q(`DELETE FROM adm_campaigns WHERE id = $1`, [idFrom(fd)]);
    return ok();
  });
}

export async function saveAnnouncement(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("marketing", async () => {
    const vals = parse(fd, announcementFields);
    const link = v.s(vals, "link_url");
    // Only on-site paths or https links — never javascript: or similar.
    if (link && !/^(\/|https:\/\/)/.test(link)) throw new FieldErrors({ link_url: "invalid" });
    if (v.b(vals, "active") && !v.s(vals, "text")) throw new FieldErrors({ text: "required" });
    await setSetting("announcement", {
      active: v.b(vals, "active"),
      text: v.s(vals, "text") ?? "",
      text_en: v.s(vals, "text_en") ?? "",
      link_url: link ?? "",
      link_label: v.s(vals, "link_label") ?? "",
    });
    return ok("اعلان سایت ذخیره شد.");
  });
}

/* ---------------- settings & users ---------------- */

export async function saveCompany(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("settings", async () => {
    const vals = parse(fd, companyFields);
    const vat = v.n(vals, "vat_rate");
    if (vat > 100) throw new FieldErrors({ vat_rate: "invalid" });
    const out: Record<string, string | number> = {};
    for (const f of companyFields) out[f.name] = f.name === "vat_rate" ? vat : v.s(vals, f.name) ?? "";
    await setSetting("company", out);
    return ok("مشخصات شرکت ذخیره شد.");
  });
}

export async function addUser(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("settings", async () => {
    const vals = parse(fd, userFields);
    const username = v.s(vals, "username")!.toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new FieldErrors({ username: "invalid" });
    const password = v.s(vals, "password")!;
    if (password.length < 8) throw new AdminError("weakPassword");
    const exists = await q1(`SELECT 1 FROM adm_users WHERE username = $1`, [username]);
    if (exists) throw new AdminError("duplicate");
    await q(`INSERT INTO adm_users (id, username, name, password_hash, role) VALUES ($1, $2, $3, $4, $5)`, [
      randomUUID(),
      username,
      v.s(vals, "name"),
      await hashPassword(password),
      v.s(vals, "role"),
    ]);
    return ok("کاربر ساخته شد.");
  });
}

export async function toggleUser(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("settings", async (user) => {
    const id = String(fd.get("id") ?? "");
    if (id === user.id) throw new AdminError("lastOwner");
    const target = await q1<{ role: string; active: boolean }>(`SELECT role, active FROM adm_users WHERE id = $1`, [id]);
    if (!target) throw new AdminError("notFound");
    if (target.role === "owner" && target.active) {
      const owners = await q1<{ c: number }>(`SELECT count(*)::int AS c FROM adm_users WHERE role = 'owner' AND active`);
      if ((owners?.c ?? 0) <= 1) throw new AdminError("lastOwner");
    }
    await q(`UPDATE adm_users SET active = NOT active WHERE id = $1`, [id]);
    await q(`DELETE FROM adm_sessions WHERE user_id = $1`, [id]);
    return ok();
  });
}

export async function changeOwnPassword(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return actForm("dashboard", async (user) => {
    const vals = parse(fd, passwordFields);
    const next = v.s(vals, "next")!;
    if (next.length < 8) throw new AdminError("weakPassword");
    if (!(await changePassword(user.id, v.s(vals, "current")!, next))) throw new AdminError("wrongPassword");
    return ok("رمز عبور تغییر کرد. نشست‌های دیگر خارج شدند.");
  });
}

export async function renameSelf(_prev: AdminState, fd: FormData): Promise<AdminState> {
  return act("dashboard", async (user) => {
    const name = String(fd.get("name") ?? "").trim().slice(0, 80);
    if (!name) throw new FieldErrors({ name: "required" });
    await q(`UPDATE adm_users SET name = $2 WHERE id = $1`, [user.id, name]);
    return ok();
  });
}
