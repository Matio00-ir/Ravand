"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { requestExpertDemo, type FormState } from "@/app/actions";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-hair-strong bg-raised px-3.5 py-3 text-[15px] text-ink transition-colors duration-[var(--t-base)] focus:border-ink focus:outline-none";
const labelClass = "t-label mb-2 block text-ink-muted";
const errorClass = "mt-1.5 block text-[12.5px] text-error";

const initialState: FormState = { status: "idle", errors: {} };

const SIZES = ["1-10", "11-50", "51-200", "200+"] as const;
const INDUSTRIES = ["manufacturing", "trading", "retail", "services", "healthcare", "fitness", "other"] as const;
const SLOTS = ["morning", "midday", "afternoon"] as const;

/**
 * The next ten working days (Saturday–Wednesday) in Tehran time, starting
 * tomorrow. Built on the client after mount: this page is statically
 * generated, so dates computed at build time would go stale.
 */
function upcomingWorkdays(locale: string): { value: string; label: string }[] {
  const tehran = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(d);
  const todayIso = tehran(new Date());
  const base = new Date(`${todayIso}T12:00:00Z`);
  const fmt = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const days: { value: string; label: string }[] = [];
  for (let i = 1; days.length < 10 && i <= 28; i++) {
    const d = new Date(base.getTime() + i * 86_400_000);
    const wd = d.getUTCDay();
    if (wd === 4 || wd === 5) continue; // Thursday, Friday
    days.push({ value: d.toISOString().slice(0, 10), label: fmt.format(d) });
  }
  return days;
}

function FieldWrap({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  const te = useTranslations("common.formErrors");
  return (
    <div className={className}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className={errorClass}>
          {te(error)}
        </span>
      ) : null}
    </div>
  );
}

/** Layer 3: ask for a live session with an expert, at a day and time that suits. */
export function ExpertRequestForm() {
  const t = useTranslations("expert.form");
  const te = useTranslations("common.formErrors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(requestExpertDemo, initialState);
  const [startedAt] = useState(() => Date.now());
  const [days, setDays] = useState<{ value: string; label: string }[]>([]);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(upcomingWorkdays(locale));
  }, [locale]);

  useEffect(() => {
    if (state.status !== "idle") track("expert_requested", { result: state.status });
  }, [state.status]);

  // Keep what was typed when the server refuses the submission.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-[var(--radius-md)] border border-line bg-raised p-8">
        <p className="t-label text-ink-muted">{t("success.eyebrow")}</p>
        <h2 className="t-h3 mt-4 text-ink">{t("success.title")}</h2>
        <p className="t-body mt-3 max-w-lg text-ink-muted">{t("success.body")}</p>
        <Link href="/dashboard" className="btn btn--ghost-light mt-8">
          {t("success.tour")}
        </Link>
      </div>
    );
  }

  const err = state.errors;
  const chip = (on: boolean) =>
    cn(
      "cursor-pointer rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[13.5px] transition-colors duration-[var(--t-base)]",
      on ? "border-ink bg-black text-offwhite" : "border-hair-strong text-ink hover:border-ink"
    );

  return (
    <form action={formAction} onSubmit={onSubmit} className="grid gap-6 sm:grid-cols-2" noValidate>
      <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />

      <FieldWrap id="name" label={t("name")} error={err.name}>
        <input id="name" name="name" required maxLength={100} className={fieldClass} aria-invalid={Boolean(err.name)} />
      </FieldWrap>
      <FieldWrap id="role" label={t("role")} error={err.role}>
        <input id="role" name="role" maxLength={80} placeholder={t("rolePlaceholder")} className={fieldClass} />
      </FieldWrap>
      <FieldWrap id="company" label={t("company")} error={err.company}>
        <input id="company" name="company" required maxLength={150} className={fieldClass} aria-invalid={Boolean(err.company)} />
      </FieldWrap>
      <FieldWrap id="mobile" label={t("mobile")} error={err.mobile}>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          placeholder="09xxxxxxxxx"
          required
          maxLength={20}
          className={fieldClass}
          aria-invalid={Boolean(err.mobile)}
        />
      </FieldWrap>
      <FieldWrap id="companySize" label={t("companySize")} error={err.companySize}>
        <select id="companySize" name="companySize" defaultValue="" className={fieldClass}>
          <option value="" disabled>
            {t("choose")}
          </option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {t(`sizes.${s}`)}
            </option>
          ))}
        </select>
      </FieldWrap>
      <FieldWrap id="industry" label={t("industry")} error={err.industry}>
        <select id="industry" name="industry" defaultValue="" className={fieldClass}>
          <option value="" disabled>
            {t("choose")}
          </option>
          {INDUSTRIES.map((s) => (
            <option key={s} value={s}>
              {t(`industries.${s}`)}
            </option>
          ))}
        </select>
      </FieldWrap>
      <FieldWrap id="needs" label={t("needs")} error={err.needs} className="sm:col-span-2">
        <textarea id="needs" name="needs" rows={4} maxLength={1000} placeholder={t("needsPlaceholder")} className={fieldClass} />
      </FieldWrap>

      <fieldset className="sm:col-span-2">
        <legend className={labelClass}>{t("date")}</legend>
        <input type="hidden" name="preferredDate" value={day} />
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button key={d.value} type="button" aria-pressed={day === d.value} onClick={() => setDay(d.value)} className={chip(day === d.value)}>
              {d.label}
            </button>
          ))}
        </div>
        {err.preferredDate ? <span className={errorClass}>{te(err.preferredDate)}</span> : null}
      </fieldset>

      <fieldset className="sm:col-span-2">
        <legend className={labelClass}>{t("slot")}</legend>
        <input type="hidden" name="preferredSlot" value={slot} />
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <button key={s} type="button" aria-pressed={slot === s} onClick={() => setSlot(s)} className={chip(slot === s)}>
              {t(`slots.${s}`)}
            </button>
          ))}
        </div>
        {err.preferredSlot ? <span className={errorClass}>{te(err.preferredSlot)}</span> : null}
        <p className="t-small mt-3 text-ink-muted">{t("slotNote")}</p>
      </fieldset>

      <div className="sm:col-span-2">
        {state.status === "error" ? (
          <p role="alert" className="t-small mb-3 text-error">
            {te(err.form ?? "generic")}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
