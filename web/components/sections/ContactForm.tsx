"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { submitContactForm, type FormState } from "@/app/actions";
import { track } from "@/lib/analytics";

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-hair-strong bg-raised px-3.5 py-3 text-[15px] text-ink transition-colors duration-[var(--t-base)] focus:border-ink focus:outline-none";
const labelClass = "t-label mb-2 block text-ink-muted";
const errorClass = "mt-1.5 block text-[12.5px] text-error";

const initialState: FormState = { status: "idle", errors: {} };

export function ContactForm() {
  const t = useTranslations("pages.contact.form");
  const te = useTranslations("common.formErrors");
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);
  // Render-to-submit timestamp for the server action's bot-timing check —
  // captured once per mount, not per render.
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (state.status === "success") track("contact_submit");
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="border-t border-ink pt-6">
        <p className="t-h4 text-ink">✓</p>
        <p className="t-small mt-2 max-w-md text-ink-muted">{t("note")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2" noValidate>
      {/* Honeypot: real visitors never see or reach this field; a filled
          value tells the server action to silently drop the submission. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />

      <div>
        <label className={labelClass} htmlFor="name">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.name)}
          aria-describedby={state.errors.name ? "name-error" : undefined}
        />
        {state.errors.name ? (
          <span id="name-error" className={errorClass}>
            {te(state.errors.name)}
          </span>
        ) : null}
      </div>
      <div>
        <label className={labelClass} htmlFor="company">
          {t("company")}
        </label>
        <input
          id="company"
          name="company"
          type="text"
          maxLength={150}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.company)}
          aria-describedby={state.errors.company ? "company-error" : undefined}
        />
        {state.errors.company ? (
          <span id="company-error" className={errorClass}>
            {te(state.errors.company)}
          </span>
        ) : null}
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.email)}
          aria-describedby={state.errors.email ? "email-error" : undefined}
        />
        {state.errors.email ? (
          <span id="email-error" className={errorClass}>
            {te(state.errors.email)}
          </span>
        ) : null}
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          {t("phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={30}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.phone)}
          aria-describedby={state.errors.phone ? "phone-error" : undefined}
        />
        {state.errors.phone ? (
          <span id="phone-error" className={errorClass}>
            {te(state.errors.phone)}
          </span>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="message">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          maxLength={2000}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.message)}
          aria-describedby={state.errors.message ? "message-error" : undefined}
        />
        {state.errors.message ? (
          <span id="message-error" className={errorClass}>
            {te(state.errors.message)}
          </span>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        {state.status === "error" ? (
          <p role="alert" className="t-small mb-3 text-error">
            {te("generic")}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
