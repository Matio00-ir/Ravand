import { cn } from "@/lib/utils";

/**
 * The RAVAND icon set: geometric, monoline, 1.5px stroke on a 20-unit
 * grid, square caps and mitred joins — technical rather than friendly.
 * Deliberately avoids the banned vocabulary (gears, cylinders, clouds,
 * arrows, checkmarks, puzzle pieces, network nodes).
 */

export type ModuleKey =
  | "erp"
  | "crm"
  | "finance"
  | "inventory"
  | "sales"
  | "workflow"
  | "hr"
  | "analytics";

const paths: Record<ModuleKey, React.ReactNode> = {
  // Layered planes — the brand's own structural motif.
  erp: (
    <>
      <path d="M10 2.5 17.5 6.5 10 10.5 2.5 6.5Z" />
      <path d="M2.5 10.5 10 14.5 17.5 10.5" />
      <path d="M2.5 14 10 18 17.5 14" />
    </>
  ),
  // Two related entities held in one structure.
  crm: (
    <>
      <path d="M2.5 2.5h6.5v6.5H2.5z" />
      <path d="M11 11h6.5v6.5H11z" />
      <path d="M9 5.75h4.75V11" />
    </>
  ),
  // Value over time, framed.
  finance: (
    <>
      <path d="M2.5 2.5v15h15" />
      <path d="M5.5 13.5 9 9.5l3 2.5 4.5-6.5" />
    </>
  ),
  // Compartmented volume.
  inventory: (
    <>
      <path d="M2.5 5.5h15v12h-15z" />
      <path d="M2.5 10h15" />
      <path d="M10 10v7.5" />
      <path d="M6.5 2.5h7v3h-7z" />
    </>
  ),
  // Progression, as a stair.
  sales: (
    <>
      <path d="M2.5 17.5h4.5V13h4.5V8.5h4.5V4" />
      <path d="M2.5 17.5h15" />
    </>
  ),
  // Two states connected by an orthogonal path (a connector, not an arrow).
  workflow: (
    <>
      <path d="M2.5 2.5h6v5h-6z" />
      <path d="M11.5 12.5h6v5h-6z" />
      <path d="M5.5 7.5v7.5h6" />
    </>
  ),
  // A modular set of roles.
  hr: (
    <>
      <path d="M2.5 2.5h6.5v6.5H2.5z" />
      <path d="M11 2.5h6.5v6.5H11z" />
      <path d="M2.5 11h6.5v6.5H2.5z" />
      <path d="M11 11h6.5v6.5H11z" fill="currentColor" stroke="none" />
    </>
  ),
  // Measured quantities.
  analytics: (
    <>
      <path d="M3.5 17.5V11" />
      <path d="M10 17.5V4" />
      <path d="M16.5 17.5V8" />
      <path d="M2.5 17.5h15" />
    </>
  ),
};

export function ModuleIcon({
  name,
  className,
  strokeWidth = 1.5,
}: {
  name: ModuleKey;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
