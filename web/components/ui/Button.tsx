import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "inverse";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold transition-colors duration-[var(--t-base)] ease-[var(--ease-flow)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-black text-offwhite hover:bg-graphite",
  secondary: "border border-hair-strong text-ink hover:border-ink",
  inverse: "bg-offwhite text-black hover:bg-white",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-[13px]",
  lg: "px-5 py-3 text-[14px]",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
} & ComponentPropsWithoutRef<"button">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
