"use client";

import { startTransition, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type ActionState } from "@/lib/sandbox/actions";

/**
 * Form primitives for the sandbox screens — the dashboard's dark tokens
 * at form density. Every sandbox form shares these so a field, its
 * error and the submit state read the same on every screen.
 */

export const inputClass =
  "w-full rounded-[var(--radius-xs)] border border-line-dark-strong bg-deep px-3 py-2.5 text-[13.5px] text-offwhite placeholder:text-steel/60 transition-colors duration-[var(--t-base)] focus:border-accent focus:outline-none disabled:opacity-50";

export const initialActionState: ActionState = { status: "idle" };

/**
 * React resets a `<form action>` after every submission — including one
 * the server refused, which would wipe what the user typed. Submitting
 * through this handler instead keeps the fields; each form clears itself
 * only after a successful save.
 */
export function submitKeepingValues(formAction: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations("sandbox.fieldErrors");
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="t-label mb-1.5 block text-steel">
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[12px] text-error">{t(error)}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-steel">{hint}</span>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  variant = "primary",
  className,
}: {
  pending: boolean;
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-xs)] px-4 py-2.5 text-[13px] font-semibold transition-colors duration-[var(--t-base)] disabled:cursor-wait disabled:opacity-60",
        variant === "primary" && "bg-offwhite text-black hover:bg-white",
        variant === "ghost" && "border border-line-dark-strong text-silver hover:border-white/30 hover:text-offwhite",
        variant === "danger" && "border border-error/40 text-[#d9a3a3] hover:border-error hover:text-offwhite",
        className
      )}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** The form-level outcome line: a business-rule error or a saved notice. */
export function FormMessage({ state, success }: { state: ActionState; success?: string }) {
  const t = useTranslations("sandbox.errors");
  if (state.status === "error" && state.error && state.error !== "fields") {
    return (
      <p role="alert" className="text-[12.5px] text-error">
        {t(state.error, { detail: state.detail ?? "" })}
      </p>
    );
  }
  if (state.status === "error" && state.error === "fields") {
    return (
      <p role="alert" className="text-[12.5px] text-error">
        {t("fields")}
      </p>
    );
  }
  if (state.status === "success" && success) {
    return (
      <p role="status" className="text-[12.5px] text-[#9ab89f]">
        {success}
      </p>
    );
  }
  return null;
}
