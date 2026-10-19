"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { loginTeam, updateLeadAction, updateRequestAction, type TeamState } from "@/lib/team-actions";
import { inputClass } from "@/components/sandbox/form-kit";
import { cn } from "@/lib/utils";

const initial: TeamState = { status: "idle" };

const btn =
  "inline-flex items-center justify-center rounded-[var(--radius-xs)] px-3 py-1.5 text-[12px] font-semibold transition-colors duration-[var(--t-base)] disabled:opacity-50";

function keepValues(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => action(fd));
  };
}

export function TeamLoginForm() {
  const t = useTranslations("team.login");
  const [state, action, pending] = useActionState(loginTeam, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="team-password" className="t-label mb-1.5 block text-steel">
          {t("password")}
        </label>
        <input id="team-password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-[12.5px] text-error">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={cn(btn, "w-full bg-offwhite py-2.5 text-[13px] text-black hover:bg-white")}>
        {t("submit")}
      </button>
    </form>
  );
}

/** Per-lead controls: extend the trial, switch access off/on, keep a note. */
export function LeadControls({ id, status, note }: { id: string; status: string; note: string | null }) {
  const t = useTranslations("team.leads");
  const [state, action, pending] = useActionState(updateLeadAction, initial);
  return (
    <form action={action} onSubmit={keepValues(action)} className="flex min-w-[15rem] flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-1.5">
        <button type="submit" name="op" value="extend" disabled={pending} className={cn(btn, "border border-line-dark-strong text-silver hover:text-offwhite")}>
          {t("extend")}
        </button>
        {status === "disabled" ? (
          <button type="submit" name="op" value="enable" disabled={pending} className={cn(btn, "border border-line-dark-strong text-silver hover:text-offwhite")}>
            {t("enable")}
          </button>
        ) : (
          <button type="submit" name="op" value="disable" disabled={pending} className={cn(btn, "border border-error/40 text-[#d9a3a3] hover:border-error")}>
            {t("disable")}
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        <label htmlFor={`note-${id}`} className="sr-only">
          {t("note")}
        </label>
        <input id={`note-${id}`} name="note" defaultValue={note ?? ""} placeholder={t("notePlaceholder")} maxLength={500} className={cn(inputClass, "py-1.5 text-[12.5px]")} />
        <button type="submit" name="op" value="note" disabled={pending} className={cn(btn, "shrink-0 border border-line-dark-strong text-silver hover:text-offwhite")}>
          {t("save")}
        </button>
      </div>
      {state.status === "error" ? <p className="text-[12px] text-error">{t(`errors.${state.error}`)}</p> : null}
    </form>
  );
}

export function RequestControls({ id, status, note }: { id: string; status: string; note: string | null }) {
  const t = useTranslations("team.requests");
  const [state, action, pending] = useActionState(updateRequestAction, initial);
  return (
    <form action={action} onSubmit={keepValues(action)} className="flex min-w-[15rem] flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`status-${id}`} className="sr-only">
        {t("status")}
      </label>
      <select id={`status-${id}`} name="status" defaultValue={status} className={cn(inputClass, "py-1.5 text-[12.5px]")}>
        {(["new", "contacted", "scheduled", "done", "cancelled"] as const).map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </select>
      <div className="flex gap-1.5">
        <label htmlFor={`rnote-${id}`} className="sr-only">
          {t("note")}
        </label>
        <input id={`rnote-${id}`} name="note" defaultValue={note ?? ""} placeholder={t("notePlaceholder")} maxLength={500} className={cn(inputClass, "py-1.5 text-[12.5px]")} />
        <button type="submit" disabled={pending} className={cn(btn, "shrink-0 bg-offwhite text-black hover:bg-white")}>
          {t("save")}
        </button>
      </div>
      {state.status === "success" ? <p className="text-[12px] text-[#9ab89f]">{t("saved")}</p> : null}
      {state.status === "error" ? <p className="text-[12px] text-error">{t(`errors.${state.error}`)}</p> : null}
    </form>
  );
}
