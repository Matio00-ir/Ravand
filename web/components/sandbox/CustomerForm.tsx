"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createCustomerAction, updateCustomerAction } from "@/lib/sandbox/actions";
import { Field, FormMessage, SubmitButton, initialActionState, inputClass, submitKeepingValues } from "@/components/sandbox/form-kit";

type Values = { name: string; phone: string | null; city: string | null };

/** Add a customer (no `customerId`) or edit one in place. */
export function CustomerForm({
  token,
  customerId,
  values,
}: {
  token: string;
  customerId?: number;
  values?: Values;
}) {
  const t = useTranslations("sandbox.customers.form");
  const action =
    customerId === undefined
      ? createCustomerAction.bind(null, token)
      : updateCustomerAction.bind(null, token, customerId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  // A fresh "add" form after each successful create; an edit keeps its values.
  useEffect(() => {
    if (state.status === "success" && customerId === undefined) formRef.current?.reset();
  }, [state, customerId]);

  const f = state.fields ?? {};
  const id = (k: string) => `customer-${customerId ?? "new"}-${k}`;

  return (
    <form ref={formRef} action={formAction} onSubmit={submitKeepingValues(formAction)} className="grid gap-4 sm:grid-cols-[2fr_1.2fr_1fr_auto] sm:items-end" noValidate>
      <Field label={t("name")} htmlFor={id("name")} error={f.name}>
        <input id={id("name")} name="name" required maxLength={120} defaultValue={values?.name} className={inputClass} />
      </Field>
      <Field label={t("phone")} htmlFor={id("phone")} error={f.phone}>
        <input
          id={id("phone")}
          name="phone"
          inputMode="tel"
          dir="ltr"
          maxLength={30}
          defaultValue={values?.phone ?? ""}
          className={`${inputClass} text-start`}
        />
      </Field>
      <Field label={t("city")} htmlFor={id("city")} error={f.city}>
        <input id={id("city")} name="city" maxLength={60} defaultValue={values?.city ?? ""} className={inputClass} />
      </Field>
      <SubmitButton pending={pending}>{customerId === undefined ? t("create") : t("save")}</SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} success={customerId === undefined ? t("created") : t("saved")} />
      </div>
    </form>
  );
}
