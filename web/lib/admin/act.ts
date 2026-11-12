import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { AdminError, requireAction, type AdminUser, type Area } from "@/lib/admin/auth";
import { parseFields, type FieldDef, type Values } from "@/lib/admin/fields";
import { q } from "@/lib/admin/schema";

/**
 * The shape every admin Server Action shares: check the caller may act
 * in this area (actions are public POST endpoints, so this runs on every
 * call), run the work, and turn the outcome into form state — or a
 * redirect, which has to be thrown outside the try/catch.
 */

export type AdminState = {
  status: "idle" | "success" | "error";
  /** A key in components/admin/form-kit's ERROR_TEXT. */
  error?: string;
  fields?: Record<string, string>;
  /** Shown on success, e.g. "ذخیره شد". */
  message?: string;
};

type Outcome = AdminState | { redirect: string };

export async function act(area: Area, work: (user: AdminUser) => Promise<Outcome>): Promise<AdminState> {
  let target: string;
  try {
    const user = await requireAction(area);
    const out = await work(user);
    if (!("redirect" in out)) {
      if (out.status === "success") refresh();
      return out;
    }
    target = out.redirect;
  } catch (err) {
    if (err instanceof AdminError) return { status: "error", error: err.code };
    console.error("[admin] action failed", err);
    return { status: "error", error: "server" };
  }
  redirect(target);
}

/** Parse a form against its field defs, failing with field errors. */
export function parse(fd: FormData, defs: FieldDef[]): Values {
  const { values, errors } = parseFields(fd, defs);
  if (Object.keys(errors).length > 0) throw new FieldErrors(errors);
  return values;
}

export class FieldErrors extends AdminError {
  constructor(public fields: Record<string, string>) {
    super("fields");
  }
}

/** act() variant that also reports per-field errors from parse(). */
export async function actForm(area: Area, work: (user: AdminUser) => Promise<Outcome>): Promise<AdminState> {
  return act(area, async (user) => {
    try {
      return await work(user);
    } catch (err) {
      if (err instanceof FieldErrors) return { status: "error", error: "fields", fields: err.fields };
      throw err;
    }
  });
}

export const ok = (message = "ذخیره شد."): AdminState => ({ status: "success", message });

export function idFrom(fd: FormData, key = "id"): number {
  const n = Number(fd.get(key));
  if (!Number.isSafeInteger(n) || n <= 0) throw new AdminError("invalid");
  return n;
}

/** Appends to an entity's timeline (deal, customer, project, ticket…). */
export async function logActivity(
  entity: string,
  entityId: string | number,
  kind: string,
  body: string,
  userId: string | null
): Promise<void> {
  await q(`INSERT INTO adm_activities (entity, entity_id, kind, body, created_by) VALUES ($1, $2, $3, $4, $5)`, [
    entity,
    String(entityId),
    kind,
    body,
    userId,
  ]);
}
