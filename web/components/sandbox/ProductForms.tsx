"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createProductAction, moveStockAction, updateProductAction } from "@/lib/sandbox/actions";
import { Field, FormMessage, SubmitButton, initialActionState, inputClass, submitKeepingValues } from "@/components/sandbox/form-kit";

type Values = {
  sku: string;
  name: string;
  unit: string;
  price: number;
  trackStock: boolean;
  reorderPoint: number;
};

/** Add a product (with opening stock) or edit an existing one's details. */
export function ProductForm({ token, productId, values }: { token: string; productId?: number; values?: Values }) {
  const t = useTranslations("sandbox.products.form");
  const isNew = productId === undefined;
  const action = isNew ? createProductAction.bind(null, token) : updateProductAction.bind(null, token, productId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [track, setTrack] = useState(values?.trackStock ?? true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && isNew) formRef.current?.reset();
  }, [state, isNew]);

  const f = state.fields ?? {};
  const id = (k: string) => `product-${productId ?? "new"}-${k}`;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={submitKeepingValues(formAction)}
      onReset={() => setTrack(values?.trackStock ?? true)}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      noValidate
    >
      <Field label={t("sku")} htmlFor={id("sku")} error={f.sku}>
        <input id={id("sku")} name="sku" maxLength={30} dir="ltr" defaultValue={values?.sku} className={`${inputClass} text-start uppercase`} />
      </Field>
      <Field label={t("name")} htmlFor={id("name")} error={f.name} className="lg:col-span-2">
        <input id={id("name")} name="name" maxLength={120} defaultValue={values?.name} className={inputClass} />
      </Field>
      <Field label={t("unit")} htmlFor={id("unit")} error={f.unit}>
        <input id={id("unit")} name="unit" maxLength={30} defaultValue={values?.unit} placeholder={t("unitPlaceholder")} className={inputClass} />
      </Field>
      <Field label={t("price")} htmlFor={id("price")} error={f.price} hint={t("priceHint")}>
        <input id={id("price")} name="price" inputMode="numeric" dir="ltr" defaultValue={values?.price} className={`${inputClass} t-num text-start`} />
      </Field>
      <Field label={t("reorderPoint")} htmlFor={id("reorder")} error={f.reorderPoint} hint={t("reorderHint")}>
        <input
          id={id("reorder")}
          name="reorderPoint"
          inputMode="numeric"
          dir="ltr"
          defaultValue={values?.reorderPoint ?? 0}
          disabled={!track}
          className={`${inputClass} t-num text-start`}
        />
      </Field>
      {isNew ? (
        <Field label={t("openingStock")} htmlFor={id("opening")} error={f.openingStock}>
          <input
            id={id("opening")}
            name="openingStock"
            inputMode="numeric"
            dir="ltr"
            defaultValue={0}
            disabled={!track}
            className={`${inputClass} t-num text-start`}
          />
        </Field>
      ) : null}
      <label className="flex items-center gap-2.5 self-end pb-2.5 text-[13px] text-silver">
        <input
          type="checkbox"
          name="trackStock"
          checked={track}
          disabled={!isNew}
          onChange={(e) => setTrack(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        {t("trackStock")}
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
        <SubmitButton pending={pending}>{isNew ? t("create") : t("save")}</SubmitButton>
        <FormMessage state={state} success={isNew ? t("created") : t("saved")} />
      </div>
    </form>
  );
}

/** Goods received, or a stock-count correction, for one product. */
export function StockMoveForm({ token, productId, unit }: { token: string; productId: number; unit: string }) {
  const t = useTranslations("sandbox.products.move");
  const [state, formAction, pending] = useActionState(moveStockAction.bind(null, token, productId), initialActionState);
  const [kind, setKind] = useState<"receipt" | "adjust">("receipt");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const f = state.fields ?? {};

  return (
    <form ref={formRef} action={formAction} onSubmit={submitKeepingValues(formAction)} className="grid gap-4 sm:grid-cols-[auto_1fr_1.4fr_auto] sm:items-end" noValidate>
      <fieldset className="flex gap-1 rounded-[var(--radius-xs)] border border-line-dark-strong p-1">
        <legend className="sr-only">{t("kind")}</legend>
        {(["receipt", "adjust"] as const).map((k) => (
          <label
            key={k}
            className={`cursor-pointer rounded-[3px] px-3 py-1.5 text-[12.5px] ${kind === k ? "bg-white/[0.09] text-offwhite" : "text-steel hover:text-silver"}`}
          >
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            {t(k)}
          </label>
        ))}
      </fieldset>
      <Field label={t("qty", { unit })} htmlFor={`move-${productId}-qty`} error={f.qty} hint={kind === "adjust" ? t("adjustHint") : undefined}>
        <input id={`move-${productId}-qty`} name="qty" inputMode="numeric" dir="ltr" className={`${inputClass} t-num text-start`} />
      </Field>
      <Field label={t("ref")} htmlFor={`move-${productId}-ref`}>
        <input id={`move-${productId}-ref`} name="ref" maxLength={60} placeholder={t("refPlaceholder")} className={inputClass} />
      </Field>
      <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} success={t("done")} />
      </div>
    </form>
  );
}
