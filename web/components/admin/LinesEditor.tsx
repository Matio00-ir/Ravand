"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/forms";
import { parseAmount } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

type Line = { key: number; description: string; qty: string; unit_price: string };
type CatalogItem = { id: number; name: string; unit: string; price: number };

const nf = new Intl.NumberFormat("fa-IR");

/**
 * Line items for quotes and invoices: free-text description or a pick
 * from the service catalogue, quantity, unit price, live totals with an
 * optional VAT. Submits as one hidden JSON field (`lines`) plus `vat`;
 * the server recomputes every total itself (lib/admin/settings.ts).
 */
export function LinesEditor({
  catalog,
  vatPercent,
  initial,
  initialVat = true,
  initialDiscount = 0,
}: {
  catalog: CatalogItem[];
  vatPercent: number;
  initial?: { description: string; qty: number; unit_price: number }[];
  initialVat?: boolean;
  initialDiscount?: number;
}) {
  const [lines, setLines] = useState<Line[]>(() =>
    (initial?.length ? initial : [{ description: "", qty: 1, unit_price: 0 }]).map((l, i) => ({
      key: i + 1,
      description: l.description,
      qty: String(l.qty),
      unit_price: l.unit_price ? String(l.unit_price) : "",
    }))
  );
  const [nextKey, setNextKey] = useState((initial?.length ?? 1) + 1);
  const [vat, setVat] = useState(initialVat);
  const [discount, setDiscount] = useState(initialDiscount);

  const parsed = lines.map((l) => {
    const qty = parseAmount(l.qty) ?? 0;
    const price = parseAmount(l.unit_price) ?? 0;
    return { ...l, q: qty, p: price, total: qty * price, valid: l.description.trim() !== "" && qty > 0 };
  });
  const subtotal = parsed.reduce((s, l) => s + (l.valid ? l.total : 0), 0);
  const tax = vat ? Math.round(((subtotal - Math.min(discount, subtotal)) * vatPercent) / 100) : 0;

  const payload = JSON.stringify(parsed.filter((l) => l.valid).map((l) => ({ description: l.description.trim(), qty: l.q, unit_price: l.p })));

  const update = (key: number, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function addFromCatalog(id: string) {
    const item = catalog.find((c) => String(c.id) === id);
    if (!item) return;
    setLines((prev) => {
      const empty = prev.find((l) => !l.description.trim());
      const line = { description: item.name, qty: "1", unit_price: item.price ? String(item.price) : "" };
      if (empty) return prev.map((l) => (l.key === empty.key ? { ...l, ...line } : l));
      return [...prev, { key: nextKey, ...line }];
    });
    setNextKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="lines" value={payload} />
      <div className="rounded-[var(--radius-sm)] border border-line-dark">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-dark px-4 py-3">
          <span className="t-label text-steel">ردیف‌ها</span>
          <label className="flex items-center gap-2 text-[12.5px] text-steel">
            افزودن از خدمات:
            <select
              value=""
              onChange={(e) => addFromCatalog(e.target.value)}
              className={cn(inputClass, "w-auto py-1.5 text-[12.5px]")}
            >
              <option value="">انتخاب خدمت…</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul>
          {parsed.map((l, i) => (
            <li
              key={l.key}
              className="grid grid-cols-2 gap-3 border-b border-line-dark px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,3fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,1.3fr)_2.25rem] md:items-center"
            >
              <input
                aria-label={`شرح ردیف ${i + 1}`}
                value={l.description}
                onChange={(e) => update(l.key, { description: e.target.value })}
                placeholder="شرح خدمت یا کالا"
                className={cn(inputClass, "col-span-2 md:col-span-1")}
              />
              <input
                aria-label="تعداد"
                value={l.qty}
                inputMode="numeric"
                dir="ltr"
                onChange={(e) => update(l.key, { qty: e.target.value })}
                className={cn(inputClass, "t-num text-start")}
              />
              <input
                aria-label="مبلغ واحد (تومان)"
                value={l.unit_price}
                inputMode="numeric"
                dir="ltr"
                placeholder="مبلغ واحد"
                onChange={(e) => update(l.key, { unit_price: e.target.value })}
                className={cn(inputClass, "t-num text-start")}
              />
              <span className="t-num text-[13px] text-offwhite md:text-end">{l.valid ? nf.format(l.total) : "—"}</span>
              <button
                type="button"
                aria-label="حذف ردیف"
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                className="grid h-9 w-9 place-items-center justify-self-end rounded-[var(--radius-xs)] text-steel hover:bg-white/[0.05] hover:text-offwhite disabled:opacity-30"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-line-dark px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setLines((prev) => [...prev, { key: nextKey, description: "", qty: "1", unit_price: "" }]);
              setNextKey((k) => k + 1);
            }}
            className="text-[13px] text-silver hover:text-offwhite"
          >
            + افزودن ردیف
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,20rem)]">
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-[13px] text-silver">
            <input type="checkbox" name="vat" checked={vat} onChange={(e) => setVat(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            اعمال مالیات بر ارزش افزوده ({nf.format(vatPercent)}٪)
          </label>
          <label className="block max-w-xs text-[12.5px] text-steel">
            تخفیف (تومان)
            <input
              name="discount"
              inputMode="numeric"
              dir="ltr"
              defaultValue={initialDiscount || ""}
              onChange={(e) => setDiscount(parseAmount(e.target.value) ?? 0)}
              className={cn(inputClass, "t-num mt-1.5 text-start")}
            />
          </label>
        </div>
        <dl className="space-y-2 self-start rounded-[var(--radius-sm)] border border-line-dark p-4 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-steel">جمع ردیف‌ها</dt>
            <dd className="t-num text-silver">{nf.format(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel">تخفیف</dt>
            <dd className="t-num text-silver">{nf.format(Math.min(discount, subtotal))}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-steel">مالیات</dt>
            <dd className="t-num text-silver">{nf.format(tax)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-dark pt-2 font-bold text-offwhite">
            <dt>مبلغ نهایی</dt>
            <dd className="t-num">
              {nf.format(subtotal - Math.min(discount, subtotal) + tax)} <span className="text-[11px] font-normal text-steel">تومان</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
