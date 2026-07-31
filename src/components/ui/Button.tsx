import React, { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretches to the container width — the usual case inside forms and modals. */
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
  "transition-colors duration-200 cursor-pointer " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  // The accent's primary job. One of these per screen, ideally.
  primary: "bg-accent text-ground hover:bg-accent-hover",
  secondary: "border border-line bg-transparent text-ink hover:border-faint hover:bg-raised",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-raised",
  // Semantic, not decorative: destructive actions only.
  danger: "bg-negative text-ground hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block = false, className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
});
