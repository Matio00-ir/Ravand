"use client";

import { useActionState, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createInvoiceAction } from "@/lib/sandbox/actions";
import { Field, FormMessage, SubmitButton, initialActionState, inputClass, submitKeepingValues } from "@/components/sandbox/form-kit";

type Option = { id: number; name: string };
type ProductOption = { id: number; name: string; unit: string; price: number; stock: number; trackStock: boolean };
type Line = { key: number; productId: number | ""; qty: string; unitPrice: string };

const VAT_RATE = 0.1;
const DUE_OPTIONS = [0, 7, 15, 30, 45, 60];

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
function parseNum(s: string): number {
  const latin = s.replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d))).replace(/[,٬،\s]/g, "");
  return /^\d+$/.test(latin) ? Number(latin) : NaN;
}

/**
 * Issue a sales invoice: customer, payment terms, any number of product
 * lines priced from the catalogue (editable), VAT, and live totals. The
 * server re-prices nothing it wasn't sent and re-checks stock itself.
 */
export function InvoiceForm({
  token,
  customers,
  products,
  defaultCustomerId,
}: {
  token: string;
  customers: Option[];
  products: ProductOption[];
  defaultCustomerId?: number;
}) {
  const t = useTranslations("sandbox.invoices.form");
  const locale = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US"), [locale]);
  const [state, formAction, pending] = useActionState(createInvoiceAction.bind(null, token), initialActionState);
  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: "", qty: "1", unitPrice: "" }]);
  const [vat, setVat] = useState(true);
  const [nextKey, setNextKey] = useState(2);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const priced = lines.map((l) => {
    const qty = parseNum(l.qty);
    const price = parseNum(l.unitPrice);
    const product = l.productId === "" ? undefined : byId.get(l.productId);
    const valid = !!product && qty > 0 && price >= 0;
    const short = !!product && product.trackStock && qty > product.stock;
    return { ...l, qty, price, product, valid, short, total: valid ? qty * price : 0 };
  });
  const subtotal = priced.reduce((s, l) => s + l.total, 0);
  const tax = vat ? Math.round((subtotal * VAT_RATE) / 10_000) * 10_000 : 0;
  const ready = priced.length > 0 && priced.every((l) => l.valid);

  const payload = JSON.stringify(
    priced.filter((l) => l.valid).map((l) => ({ productId: l.product!.id, qty: l.qty, unitPrice: l.price }))
  );

  function update(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function chooseProduct(key: number, value: string) {
    const id = value === "" ? "" : Number(value);
    const product = id === "" ? undefined : byId.get(id);
    update(key, { productId: id, unitPrice: product ? String(product.price) : "" });
  }

  const f = state.fields ?? {};

  return (
    <form action={formAction} onSubmit={submitKeepingValues(formAction)} className="space-y-6" noValidate>
      <input type="hidden" name="lines" value={payload} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("customer")} htmlFor="inv-customer" error={f.customerId} className="sm:col-span-2">
          <select id="inv-customer" name="customerId" defaultValue={defaultCustomerId ?? ""} className={inputClass}>
            <option value="" disabled>
              {t("chooseCustomer")}
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("terms")} htmlFor="inv-due" error={f.dueDays}>
          <select id="inv-due" name="dueDays" defaultValue={30} className={inputClass}>
            {DUE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? t("termsCash") : t("termsDays", { days: nf.format(d) })}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="rounded-[var(--radius-sm)] border border-line-dark">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2.25rem] gap-3 border-b border-line-dark px-4 py-2.5 md:grid">
          {[t("product"), t("qty"), t("unitPrice"), t("lineTotal")].map((h, i) => (
            <span key={h} className={`t-label text-steel ${i === 3 ? "text-end" : ""}`}>
              {h}
            </span>
          ))}
        </div>
        <ul>
          {priced.map((l, idx) => (
            <li
              key={l.key}
              className="grid grid-cols-2 gap-3 border-b border-line-dark px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,2.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2.25rem] md:items-center"
            >
              <div className="col-span-2 md:col-span-1">
                <label htmlFor={`line-${l.key}-product`} className="sr-only">
                  {t("product")} {idx + 1}
                </label>
                <select
                  id={`line-${l.key}-product`}
                  value={l.productId}
                  onChange={(e) => chooseProduct(l.key, e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("chooseProduct")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.trackStock ? ` — ${t("inStock", { qty: nf.format(p.stock), unit: p.unit })}` : ""}
                    </option>
                  ))}
                </select>
                {l.short ? (
                  <span className="mt-1 block text-[12px] text-warning">
                    {t("shortStock", { qty: nf.format(l.product!.stock), unit: l.product!.unit })}
                  </span>
                ) : null}
              </div>
              <div>
                <label htmlFor={`line-${l.key}-qty`} className="t-label mb-1 block text-steel md:sr-only">
                  {t("qty")}
                </label>
                <input
                  id={`line-${l.key}-qty`}
                  value={l.qty}
                  inputMode="numeric"
                  dir="ltr"
                  onChange={(e) => update(l.key, { qty: e.target.value })}
                  className={`${inputClass} t-num text-start`}
                />
              </div>
              <div>
                <label htmlFor={`line-${l.key}-price`} className="t-label mb-1 block text-steel md:sr-only">
                  {t("unitPrice")}
                </label>
                <input
                  id={`line-${l.key}-price`}
                  value={l.unitPrice}
                  inputMode="numeric"
                  dir="ltr"
                  onChange={(e) => update(l.key, { unitPrice: e.target.value })}
                  className={`${inputClass} t-num text-start`}
                />
              </div>
              <p className="t-num text-[13px] text-offwhite md:text-end">{l.valid ? nf.format(l.total) : "—"}</p>
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                disabled={lines.length === 1}
                aria-label={t("removeLine")}
                className="grid h-9 w-9 place-items-center justify-self-end rounded-[var(--radius-xs)] text-steel hover:bg-white/[0.05] hover:text-offwhite disabled:opacity-30"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-line-dark px-4 py-3">
          <button
            type="button"
            disabled={lines.length >= 20}
            onClick={() => {
              setLines((prev) => [...prev, { key: nextKey, productId: "", qty: "1", unitPrice: "" }]);
              setNextKey((k) => k + 1);
            }}
            className="text-[13px] text-silver hover:text-offwhite disabled:opacity-40"
          >
            + {t("addLine")}
          </button>
        </div>
        {f.lines ? <p className="px-4 pb-3 text-[12px] text-error">{t("linesInvalid")}</p> : null}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,20rem)]">
        <div className="space-y-4">
          <Field label={t("note")} htmlFor="inv-note">
            <textarea id="inv-note" name="note" rows={3} maxLength={300} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2.5 text-[13px] text-silver">
            <input
              type="checkbox"
              name="vat"
              checked={vat}
              onChange={(e) => setVat(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t("vat")}
          </label>
        </div>
        <dl className="space-y-2.5 self-start rounded-[var(--radius-sm)] border border-line-dark p-4 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-steel">{t("subtotal")}</dt>
            <dd className="t-num text-silver">{nf.format(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel">{t("tax")}</dt>
            <dd className="t-num text-silver">{nf.format(tax)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-dark pt-2.5">
            <dt className="font-semibold text-offwhite">{t("total")}</dt>
            <dd className="t-num font-bold text-offwhite">
              {nf.format(subtotal + tax)} <span className="text-[11px] font-normal text-steel">{t("currency")}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending} className={!ready ? "pointer-events-none opacity-50" : undefined}>
          {t("submit")}
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
