"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { AdminState } from "@/lib/admin/act";
import { isoToJalali } from "@/lib/admin/jalali";
import { parseAmount, type FieldDef, type Values } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

/**
 * The admin panel's form toolkit. EntityForm renders any set of
 * FieldDefs (lib/admin/fields.ts) and talks to an action built with
 * lib/admin/act.ts; ActionButton and AutoSelect cover one-click and
 * change-to-save controls. Fields keep their values when the server
 * refuses a submission, and clear only when a create succeeds.
 */

type Action = (prev: AdminState, fd: FormData) => Promise<AdminState>;

export const inputClass =
  "w-full rounded-[var(--radius-xs)] border border-line-dark-strong bg-deep px-3 py-2.5 text-[13.5px] text-offwhite placeholder:text-steel/60 transition-colors duration-[var(--t-base)] focus:border-accent focus:outline-none disabled:opacity-50";

const ERROR_TEXT: Record<string, string> = {
  fields: "لطفاً موارد مشخص‌شده را اصلاح کنید.",
  server: "ذخیره انجام نشد. لطفاً دوباره تلاش کنید.",
  forbidden: "اجازه این کار را ندارید یا نشست شما منقضی شده است.",
  invalid: "درخواست نامعتبر است.",
  notFound: "این مورد پیدا نشد.",
  hasPayments: "این فاکتور دریافتی دارد و قابل ابطال نیست.",
  overpay: "مبلغ از مانده فاکتور بیشتر است.",
  notPayable: "این فاکتور تسویه یا باطل شده است.",
  inUse: "این مورد در جای دیگری استفاده شده و قابل حذف نیست.",
  duplicate: "مورد دیگری با همین مشخصات وجود دارد.",
  wrongPassword: "رمز فعلی درست نیست.",
  weakPassword: "رمز جدید باید حداقل ۸ کاراکتر باشد.",
  lastOwner: "حداقل یک مدیر کل فعال باید باقی بماند.",
  noLines: "حداقل یک ردیف کامل لازم است.",
  noCustomer: "ابتدا این فرصت را به مشتری تبدیل کنید یا مشتری را انتخاب کنید.",
};

const FIELD_ERROR_TEXT: Record<string, string> = {
  required: "الزامی است.",
  invalid: "مقدار معتبر نیست.",
  tooLong: "بیش از حد طولانی است.",
  date: "تاریخ را به شکل ۱۴۰۵/۰۸/۱۲ وارد کنید.",
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (s: string) => s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
const nf = new Intl.NumberFormat("fa-IR");

function keepValues(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => action(fd));
  };
}

export function Message({ state }: { state: AdminState }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="text-[12.5px] text-error">
        {ERROR_TEXT[state.error ?? "server"] ?? ERROR_TEXT.server}
      </p>
    );
  }
  if (state.status === "success" && state.message) {
    return (
      <p role="status" className="text-[12.5px] text-[#9ab89f]">
        {state.message}
      </p>
    );
  }
  return null;
}

export function Button({
  children,
  pending,
  variant = "primary",
  className,
  ...rest
}: {
  children: ReactNode;
  pending?: boolean;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-xs)] px-4 py-2.5 text-[13px] font-semibold transition-colors duration-[var(--t-base)] disabled:cursor-wait disabled:opacity-60",
        variant === "primary" && "bg-offwhite text-black hover:bg-white",
        variant === "ghost" && "border border-line-dark-strong text-silver hover:border-white/30 hover:text-offwhite",
        variant === "danger" && "border border-error/40 text-[#d9a3a3] hover:border-error hover:text-offwhite",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function MoneyInput({ id, name, defaultValue, error }: { id: string; name: string; defaultValue?: string; error?: boolean }) {
  const [raw, setRaw] = useState(defaultValue ?? "");
  const n = raw ? parseAmount(raw) : null;
  return (
    <>
      <input
        id={id}
        name={name}
        inputMode="numeric"
        dir="ltr"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-invalid={error}
        className={cn(inputClass, "t-num text-start")}
      />
      <span className="mt-1 block min-h-[1.1em] text-[11.5px] text-steel">{n !== null && n > 0 ? `${nf.format(n)} تومان` : ""}</span>
    </>
  );
}

const SPAN: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};

function displayValue(def: FieldDef, value: Values[string] | undefined): string {
  if (value === null || value === undefined) return "";
  if (def.type === "date") return toFa(isoToJalali(String(value)));
  return String(value);
}

export function FieldInput({ def, value, error, idPrefix }: { def: FieldDef; value?: Values[string]; error?: string; idPrefix: string }) {
  const id = `${idPrefix}-${def.name}`;
  const common = { id, name: def.name, "aria-invalid": Boolean(error) };
  const dv = displayValue(def, value);
  let control: ReactNode;

  switch (def.type) {
    case "textarea":
      control = <textarea {...common} rows={3} defaultValue={dv} placeholder={def.placeholder} maxLength={def.max ?? 4000} className={inputClass} />;
      break;
    case "select":
      control = (
        <select {...common} defaultValue={dv} className={inputClass}>
          {!def.required || def.allowEmpty || !dv ? <option value="">{def.placeholder ?? "انتخاب کنید"}</option> : null}
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      return (
        <label className={cn("flex items-center gap-2.5 self-end pb-2.5 text-[13px] text-silver", SPAN[def.span ?? 2])}>
          <input type="checkbox" name={def.name} defaultChecked={value === true} className="h-4 w-4 accent-[var(--accent)]" />
          {def.label}
        </label>
      );
    case "money":
      control = <MoneyInput id={id} name={def.name} defaultValue={dv} error={Boolean(error)} />;
      break;
    case "date":
      control = <input {...common} defaultValue={dv} placeholder="۱۴۰۵/۰۸/۱۲" dir="ltr" className={cn(inputClass, "t-num text-start")} />;
      break;
    default:
      control = (
        <input
          {...common}
          type={def.type === "int" ? "text" : def.type}
          inputMode={def.type === "int" ? "numeric" : undefined}
          dir={def.type === "tel" || def.type === "email" || def.type === "int" ? "ltr" : undefined}
          defaultValue={dv}
          placeholder={def.placeholder}
          maxLength={def.max ?? 200}
          autoComplete={def.type === "password" ? "new-password" : undefined}
          className={cn(inputClass, (def.type === "tel" || def.type === "email" || def.type === "int") && "text-start")}
        />
      );
  }

  return (
    <div className={cn("min-w-0", SPAN[def.span ?? (def.type === "textarea" ? 4 : 2)])}>
      <label htmlFor={id} className="t-label mb-1.5 block text-steel">
        {def.label}
        {def.required ? <span className="text-error/80"> *</span> : null}
      </label>
      {control}
      {error ? (
        <span className="mt-1 block text-[12px] text-error">{FIELD_ERROR_TEXT[error] ?? FIELD_ERROR_TEXT.invalid}</span>
      ) : def.hint ? (
        <span className="mt-1 block text-[11.5px] text-steel">{def.hint}</span>
      ) : null}
    </div>
  );
}

export function EntityForm({
  action,
  fields,
  values,
  hidden,
  submitLabel = "ذخیره",
  resetOnSuccess = false,
  children,
}: {
  action: Action;
  fields: FieldDef[];
  values?: Values;
  hidden?: Record<string, string | number>;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as AdminState);
  const ref = useRef<HTMLFormElement>(null);
  const prefix = useId();
  // Remount the fields after a successful create so every input
  // (including the controlled money ones) returns to empty.
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (state.status === "success" && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      onSubmit={keepValues(formAction)}
      onReset={() => setRound((r) => r + 1)}
      className="space-y-5"
      noValidate
    >
      {hidden ? Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />) : null}
      <div key={round} className="grid gap-4 md:grid-cols-4">
        {fields.map((def) => (
          <FieldInput key={def.name} def={def} value={values?.[def.name]} error={state.fields?.[def.name]} idPrefix={prefix} />
        ))}
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" pending={pending}>
          {submitLabel}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

/** A one-click action (delete, convert, mark done…), optionally confirmed. */
export function ActionButton({
  action,
  label,
  confirm,
  hidden,
  variant = "ghost",
  small = false,
}: {
  action: Action;
  label: string;
  confirm?: string;
  hidden?: Record<string, string | number>;
  variant?: "primary" | "ghost" | "danger";
  small?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as AdminState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        keepValues(formAction)(e);
      }}
      className="inline-flex flex-col items-start gap-1.5"
    >
      {hidden ? Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />) : null}
      <Button type="submit" pending={pending} variant={variant} className={small ? "px-3 py-1.5 text-[12px]" : undefined}>
        {label}
      </Button>
      {state.status === "error" ? <Message state={state} /> : null}
    </form>
  );
}

/** A select that saves as soon as it changes (deal stage, ticket status…). */
export function AutoSelect({
  action,
  name,
  value,
  options,
  hidden,
  label,
}: {
  action: Action;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  hidden?: Record<string, string | number>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as AdminState);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={formAction} onSubmit={keepValues(formAction)} className="min-w-0">
      {hidden ? Object.entries(hidden).map(([k, val]) => <input key={k} type="hidden" name={k} value={val} />) : null}
      <label>
        <span className="sr-only">{label}</span>
        <select
          name={name}
          defaultValue={value}
          disabled={pending}
          onChange={() => ref.current?.requestSubmit()}
          className={cn(inputClass, "py-1.5 text-[12.5px]")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {state.status === "error" ? <Message state={state} /> : null}
    </form>
  );
}
