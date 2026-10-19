"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { recordPaymentAction } from "@/lib/sandbox/actions";
import { Field, FormMessage, SubmitButton, initialActionState, inputClass, submitKeepingValues } from "@/components/sandbox/form-kit";

/** Record money received against an invoice — full or partial. */
export function PaymentForm({ token, invoiceId, remaining }: { token: string; invoiceId: number; remaining: number }) {
  const t = useTranslations("sandbox.invoices.payment");
  const [state, formAction, pending] = useActionState(recordPaymentAction.bind(null, token, invoiceId), initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const f = state.fields ?? {};

  return (
    <form ref={formRef} action={formAction} onSubmit={submitKeepingValues(formAction)} className="space-y-4" noValidate>
      <Field label={t("amount")} htmlFor="pay-amount" error={f.amount}>
        <input
          id="pay-amount"
          name="amount"
          inputMode="numeric"
          dir="ltr"
          defaultValue={remaining}
          className={`${inputClass} t-num text-start`}
        />
      </Field>
      <Field label={t("method")} htmlFor="pay-method" error={f.method}>
        <select id="pay-method" name="method" defaultValue="transfer" className={inputClass}>
          {(["transfer", "card", "cash", "cheque"] as const).map((m) => (
            <option key={m} value={m}>
              {t(`methods.${m}`)}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
        <FormMessage state={state} success={t("done")} />
      </div>
    </form>
  );
}
