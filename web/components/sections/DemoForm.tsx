"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-hair-strong bg-raised px-3.5 py-3 text-[15px] text-ink transition-colors duration-[var(--t-base)] focus:border-ink focus:outline-none";
const labelClass = "t-label mb-2 block text-ink-muted";

export function DemoForm() {
  const t = useTranslations("pages.demo.form");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No backend is connected yet — see /docs/REPORT.md for the recommended
    // integration (form-handling service or CRM webhook + provisioning flow).
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="border-t border-ink pt-6">
        <p className="t-h4 text-ink">✓</p>
        <p className="t-small mt-2 max-w-md text-ink-muted">{t("note")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="name">
          {t("name")}
        </label>
        <input id="name" name="name" type="text" required className={fieldClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="company">
          {t("company")}
        </label>
        <input id="company" name="company" type="text" required className={fieldClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="role">
          {t("role")}
        </label>
        <input id="role" name="role" type="text" className={fieldClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="teamSize">
          {t("teamSize")}
        </label>
        <select id="teamSize" name="teamSize" className={fieldClass} defaultValue="">
          <option value="" disabled></option>
          <option value="1-10">1–10</option>
          <option value="11-50">11–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className={fieldClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          {t("phone")}
        </label>
        <input id="phone" name="phone" type="tel" className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="interest">
          {t("interest")}
        </label>
        <input id="interest" name="interest" type="text" className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
