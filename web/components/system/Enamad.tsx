import { ENAMAD, hasEnamad } from "@/lib/company";

/**
 * The eNamad trust seal (نماد اعتماد الکترونیکی). Renders nothing until
 * ENAMAD.id and ENAMAD.code are set in lib/company.ts.
 *
 * Built from the official snippet: the link and image must load from
 * trustseal.enamad.ir with referrerpolicy="origin", because eNamad checks
 * the referring domain to confirm the seal belongs to this site. The
 * image host is allowed in the CSP (next.config.ts, img-src).
 */
export function Enamad({ className }: { className?: string }) {
  if (!hasEnamad()) return null;
  const query = `id=${encodeURIComponent(ENAMAD.id)}&Code=${encodeURIComponent(ENAMAD.code)}`;

  return (
    <a
      href={`https://trustseal.enamad.ir/?${query}`}
      target="_blank"
      rel="noopener"
      referrerPolicy="origin"
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- third-party seal served by eNamad; must stay a plain <img> */}
      <img
        src={`https://trustseal.enamad.ir/logo.aspx?${query}`}
        alt="نماد اعتماد الکترونیکی"
        referrerPolicy="origin"
        width={90}
        height={90}
        className="rounded-[var(--radius-sm)] bg-white p-1"
      />
    </a>
  );
}
