import { type ReactNode } from "react";
import { fa, jdate } from "@/components/admin/ui";
import type { Company } from "@/lib/admin/settings";

type Party = {
  name: string;
  national_id?: string | null;
  economic_code?: string | null;
  address?: string | null;
  postal_code?: string | null;
  phone?: string | null;
};

/**
 * A quote or invoice as a printable page: seller and buyer blocks (the
 * fields an Iranian official invoice carries), line items, totals. It
 * renders as paper on screen and is the only thing that prints — the
 * admin chrome is hidden with print: utilities.
 */
export function DocSheet({
  kind,
  number,
  issued,
  due,
  dueLabel,
  seller,
  buyer,
  lines,
  subtotal,
  discount,
  tax,
  total,
  paid,
  notes,
  footer,
}: {
  kind: string;
  number: string;
  issued: string;
  due?: string | null;
  dueLabel?: string;
  seller: Company;
  buyer: Party;
  lines: { description: string; qty: number; unit_price: number; line_total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid?: number;
  notes?: string | null;
  footer?: ReactNode;
}) {
  const cell = "border border-black/15 px-3 py-2";
  return (
    <article className="doc-sheet mx-auto min-w-0 max-w-[900px] rounded-[var(--radius-md)] bg-white p-6 text-[13px] leading-relaxed text-[#111] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] md:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-black/80 pb-5">
        <div>
          <p className="text-[22px] font-bold">{kind}</p>
          <p className="mt-1 text-[12px] text-black/60">{seller.brand || "روند"}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[12.5px]">
          <dt className="text-black/60">شماره</dt>
          <dd className="font-mono font-semibold" dir="ltr">{number}</dd>
          <dt className="text-black/60">تاریخ</dt>
          <dd>{jdate(issued)}</dd>
          {due ? (
            <>
              <dt className="text-black/60">{dueLabel ?? "سررسید"}</dt>
              <dd>{jdate(due)}</dd>
            </>
          ) : null}
        </dl>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <PartyBox title="فروشنده" party={{ name: seller.legal_name || seller.brand || "روند", national_id: seller.national_id, economic_code: seller.economic_code, address: seller.address, postal_code: seller.postal_code, phone: seller.phone }} />
        <PartyBox title="خریدار" party={buyer} />
      </section>

      <div className="relative mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className={`${cell} w-10 text-center`}>ردیف</th>
            <th className={`${cell} text-start`}>شرح کالا یا خدمت</th>
            <th className={`${cell} w-20 text-center`}>تعداد</th>
            <th className={`${cell} w-36 text-end`}>مبلغ واحد (تومان)</th>
            <th className={`${cell} w-40 text-end`}>مبلغ کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className={`${cell} text-center`}>{fa(i + 1)}</td>
              <td className={cell}>{l.description}</td>
              <td className={`${cell} text-center`}>{fa(l.qty)}</td>
              <td className={`${cell} text-end`}>{fa(l.unit_price)}</td>
              <td className={`${cell} text-end`}>{fa(l.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <SumRow label="جمع" value={subtotal} cell={cell} />
          {discount ? <SumRow label="تخفیف" value={-discount} cell={cell} /> : null}
          <SumRow label="مالیات و عوارض ارزش افزوده" value={tax} cell={cell} />
          <SumRow label="مبلغ قابل پرداخت" value={total} cell={cell} strong />
          {paid !== undefined ? (
            <>
              <SumRow label="پرداخت‌شده" value={paid} cell={cell} />
              <SumRow label="مانده" value={Math.max(0, total - paid)} cell={cell} strong />
            </>
          ) : null}
        </tfoot>
      </table>
      </div>

      {notes ? <p className="mt-5 whitespace-pre-line text-[12.5px]">{notes}</p> : null}
      {seller.bank ? <p className="mt-3 text-[12.5px]">اطلاعات پرداخت: {seller.bank}</p> : null}
      {seller.invoice_note ? <p className="mt-3 whitespace-pre-line text-[12px] text-black/70">{seller.invoice_note}</p> : null}

      <footer className="mt-10 grid grid-cols-2 gap-6 text-center text-[12px] text-black/60">
        <div className="border-t border-black/30 pt-2">مهر و امضای فروشنده</div>
        <div className="border-t border-black/30 pt-2">مهر و امضای خریدار</div>
      </footer>
      {footer}
    </article>
  );
}

function PartyBox({ title, party }: { title: string; party: Party }) {
  return (
    <div className="rounded border border-black/15 p-3.5">
      <p className="text-[11.5px] font-semibold text-black/60">{title}</p>
      <p className="mt-1 text-[14px] font-bold">{party.name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
        {party.national_id ? (<><dt className="text-black/55">شناسه ملی</dt><dd>{party.national_id}</dd></>) : null}
        {party.economic_code ? (<><dt className="text-black/55">کد اقتصادی</dt><dd>{party.economic_code}</dd></>) : null}
        {party.phone ? (<><dt className="text-black/55">تلفن</dt><dd dir="ltr" className="text-end">{party.phone}</dd></>) : null}
        {party.postal_code ? (<><dt className="text-black/55">کد پستی</dt><dd>{party.postal_code}</dd></>) : null}
        {party.address ? (<><dt className="text-black/55">نشانی</dt><dd>{party.address}</dd></>) : null}
      </dl>
    </div>
  );
}

function SumRow({ label, value, cell, strong = false }: { label: string; value: number; cell: string; strong?: boolean }) {
  return (
    <tr className={strong ? "bg-black/[0.04] font-bold" : undefined}>
      <td colSpan={4} className={`${cell} text-end`}>
        {label}
      </td>
      <td className={`${cell} text-end`}>{value < 0 ? `(${fa(-value)})` : fa(value)}</td>
    </tr>
  );
}
