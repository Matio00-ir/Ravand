"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createDemoLead, type FormState } from "@/app/actions";
import { track } from "@/lib/analytics";
import { type ModuleKey } from "@/components/system/ModuleIcon";

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-hair-strong bg-raised px-3.5 py-3 text-[15px] text-ink transition-colors duration-[var(--t-base)] focus:border-ink focus:outline-none";
const labelClass = "t-label mb-2 block text-ink-muted";
const errorClass = "mt-1.5 block text-[12.5px] text-error";

const initialState: FormState = { status: "idle", errors: {} };

/**
 * The builder's final step: just enough contact info to create a private
 * demo (name, company, mobile — no email, see demoLeadSchema) plus the
 * configuration built in the previous steps, carried as hidden fields.
 * On success the server action redirects straight into /demo/[token] —
 * there's no client-side "success" branch to render here, since the page
 * navigates away before one would ever show.
 */
export function DemoLeadForm({
  businessType,
  modules,
  workflow,
  userCount,
}: {
  businessType: string;
  modules: ModuleKey[];
  workflow: string[];
  userCount: number;
}) {
  const t = useTranslations("pages.demo.form");
  const te = useTranslations("common.formErrors");
  const [state, formAction, pending] = useActionState(createDemoLead, initialState);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (state.status === "error") track("lead_submitted", { result: "error" });
  }, [state.status]);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2" noValidate>
      {/* Honeypot: real visitors never see or reach this field; a filled
          value tells the server action to silently drop the submission. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="businessType" value={businessType} />
      <input type="hidden" name="modules" value={JSON.stringify(modules)} />
      <input type="hidden" name="workflow" value={JSON.stringify(workflow)} />
      <input type="hidden" name="userCount" value={userCount} />

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
          required
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
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="mobile">
          {t("mobile")}
        </label>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          placeholder="09xxxxxxxxx"
          required
          maxLength={20}
          className={fieldClass}
          aria-invalid={Boolean(state.errors.mobile)}
          aria-describedby={state.errors.mobile ? "mobile-error" : undefined}
        />
        {state.errors.mobile ? (
          <span id="mobile-error" className={errorClass}>
            {te(state.errors.mobile)}
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
