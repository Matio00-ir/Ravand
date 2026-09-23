"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * A real production-cost calculator: raw materials + packaging + labor +
 * overhead + tax → unit/total cost → margin → selling price. Every number
 * below is computed live from the inputs, not staged — this is the one
 * place the site demonstrates the manufacturing use case with actual
 * arithmetic instead of a static illustration. `t("example")` in the
 * caller's copy is what marks it as a sample scenario, not a quote.
 */
export function ProductionCostCalculator({
  dark = false,
  className,
}: {
  dark?: boolean;
  className?: string;
}) {
  const t = useTranslations("production");
  const locale = useLocale();

  const [quantity, setQuantity] = useState(1500);
  const [rawMaterial, setRawMaterial] = useState(180_000);
  const [packaging, setPackaging] = useState(12_000);
  const [labor, setLabor] = useState(45_000);
  const [overhead, setOverhead] = useState(30_000);
  const [tax, setTax] = useState(9);
  const [margin, setMargin] = useState(25);

  const result = useMemo(() => {
    const unitCostPreTax = rawMaterial + packaging + labor + overhead;
    const totalCostPreTax = unitCostPreTax * quantity;
    const taxAmount = totalCostPreTax * (tax / 100);
    const totalCost = totalCostPreTax + taxAmount;
    const unitCost = totalCost / Math.max(1, quantity);
    const unitPrice = unitCost * (1 + margin / 100);
    const totalPrice = unitPrice * quantity;
    const profit = totalPrice - totalCost;
    return { unitCost, totalCost, unitPrice, totalPrice, profit };
  }, [quantity, rawMaterial, packaging, labor, overhead, tax, margin]);

  const money = (n: number) =>
    `${new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(n))} ${t("toman")}`;

  const fieldClass = cn(
    "w-full rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[14px] transition-colors duration-[var(--t-base)] focus:outline-none",
    dark
      ? "border-line-dark bg-deep-raised text-offwhite focus:border-silver"
      : "border-hair-strong bg-raised text-ink focus:border-ink"
  );
  const labelClass = cn("t-label mb-1.5 block", dark ? "text-steel" : "text-ink-muted");
  const mutedClass = dark ? "text-steel" : "text-ink-muted";

  const fields: { key: string; label: string; value: number; onChange: (v: number) => void }[] = [
    { key: "quantity", label: t("quantity"), value: quantity, onChange: setQuantity },
    { key: "rawMaterial", label: t("rawMaterial"), value: rawMaterial, onChange: setRawMaterial },
    { key: "packaging", label: t("packaging"), value: packaging, onChange: setPackaging },
    { key: "labor", label: t("labor"), value: labor, onChange: setLabor },
    { key: "overhead", label: t("overhead"), value: overhead, onChange: setOverhead },
    { key: "tax", label: t("tax"), value: tax, onChange: setTax },
    { key: "margin", label: t("margin"), value: margin, onChange: setMargin },
  ];

  return (
    <div className={className}>
      <p className={cn("t-small mb-6", mutedClass)}>{t("example")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={labelClass} htmlFor={`prodcalc-${f.key}`}>
              {f.label}
            </label>
            <input
              id={`prodcalc-${f.key}`}
              type="number"
              min={0}
              inputMode="numeric"
              value={f.value}
              onChange={(e) => f.onChange(Math.max(0, Number(e.target.value) || 0))}
              className={fieldClass}
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-8 rounded-[var(--radius-md)] border p-5",
          dark ? "border-line-dark bg-deep-raised" : "border-hair-strong bg-raised"
        )}
      >
        <p className={cn("t-label mb-4", mutedClass)}>{t("resultTitle")}</p>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <ResultItem muted={mutedClass} dark={dark} label={t("unitCost")} value={money(result.unitCost)} />
          <ResultItem muted={mutedClass} dark={dark} label={t("totalCost")} value={money(result.totalCost)} />
          <ResultItem muted={mutedClass} dark={dark} label={t("unitPrice")} value={money(result.unitPrice)} />
          <ResultItem muted={mutedClass} dark={dark} label={t("totalPrice")} value={money(result.totalPrice)} />
          <ResultItem muted={mutedClass} dark={dark} label={t("profit")} value={money(result.profit)} accent />
        </dl>
      </div>
    </div>
  );
}

function ResultItem({
  label,
  value,
  dark,
  muted,
  accent = false,
}: {
  label: string;
  value: string;
  dark: boolean;
  muted: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className={cn("t-label truncate", muted)}>{label}</dt>
      <dd
        className={cn(
          "t-num mt-2 truncate text-[1.05rem] font-bold",
          accent ? (dark ? "text-offwhite" : "text-ink") : dark ? "text-silver" : "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
