import { type ReactNode } from "react";
import { Zone } from "@/components/system/Zone";

/**
 * Hub-page opening: the same even grid as the hero at lower amplitude.
 * One label, one heading, one supporting line.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Zone tone="light" grid className="border-b border-line">
      <div className="shell pt-16 pb-16 md:pt-24 md:pb-20">
        <p className="t-label text-ink-muted">{eyebrow}</p>
        <h1 className="t-display mt-6 max-w-3xl text-ink">{title}</h1>
        {description ? (
          <p className="t-lead mt-6 max-w-xl text-ink-muted">{description}</p>
        ) : null}
        {children}
      </div>
    </Zone>
  );
}
