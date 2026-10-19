"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { TEAM_COOKIE, checkPassword, isTeamSession, issueSession, teamPanelEnabled } from "@/lib/team-auth";
import { extendLead, setLeadNote, setLeadStatus } from "@/lib/team-data";
import { REQUEST_STATUSES, updateExpertRequest, type RequestStatus } from "@/lib/expert-requests";

/**
 * Team panel mutations. Each one re-checks the session cookie itself:
 * Server Actions are plain POST endpoints, so the page's own gate is not
 * enough.
 */

export type TeamState = { status: "idle" | "success" | "error"; error?: string };

async function teamPath() {
  return (await getLocale()) === "en" ? "/en/team" : "/team";
}

export async function loginTeam(_prev: TeamState, fd: FormData): Promise<TeamState> {
  if (!teamPanelEnabled()) return { status: "error", error: "disabled" };
  const password = String(fd.get("password") ?? "");
  if (!checkPassword(password)) {
    // A short fixed delay blunts online guessing without any extra state.
    await new Promise((r) => setTimeout(r, 800));
    return { status: "error", error: "wrong" };
  }
  const session = issueSession();
  (await cookies()).set(TEAM_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  redirect(await teamPath());
}

export async function logoutTeam(): Promise<void> {
  (await cookies()).delete(TEAM_COOKIE);
  redirect(await teamPath());
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateLeadAction(_prev: TeamState, fd: FormData): Promise<TeamState> {
  if (!(await isTeamSession())) return { status: "error", error: "session" };
  const id = String(fd.get("id") ?? "");
  if (!UUID.test(id)) return { status: "error", error: "invalid" };

  const op = String(fd.get("op") ?? "");
  if (op === "extend") await extendLead(id, 7);
  else if (op === "disable") await setLeadStatus(id, "disabled");
  else if (op === "enable") await setLeadStatus(id, "active");
  else if (op === "note") await setLeadNote(id, String(fd.get("note") ?? "").trim().slice(0, 500));
  else return { status: "error", error: "invalid" };

  refresh();
  return { status: "success" };
}

export async function updateRequestAction(_prev: TeamState, fd: FormData): Promise<TeamState> {
  if (!(await isTeamSession())) return { status: "error", error: "session" };
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "") as RequestStatus;
  if (!UUID.test(id) || !REQUEST_STATUSES.includes(status)) return { status: "error", error: "invalid" };
  await updateExpertRequest(id, status, String(fd.get("note") ?? "").trim().slice(0, 500));
  refresh();
  return { status: "success" };
}
