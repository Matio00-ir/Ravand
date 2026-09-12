import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Every zone of the site shares this measure. It is what makes the
 * structural rails line up across section boundaries, so the page reads
 * as one composition rather than a stack of independent blocks.
 */
export function Shell({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "nav";
}) {
  return <Tag className={cn("shell relative", className)}>{children}</Tag>;
}
