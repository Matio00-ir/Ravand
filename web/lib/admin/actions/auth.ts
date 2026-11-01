"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/admin/auth";
import type { AdminState } from "@/lib/admin/act";

export async function loginAction(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const username = String(fd.get("username") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { status: "error", error: "fields" };

  let result;
  try {
    result = await login(username, password);
  } catch (err) {
    console.error("[admin] login failed", err);
    return { status: "error", error: "server" };
  }
  if (!result.ok) return { status: "error", error: result.reason };
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}
