import React, { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "positive";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretches to the container width — the usual case inside forms and modals. */
  block?: boolean;
  /**
   * Swaps the label for a spinner and disables the button. Width is held
   * constant while loading: a button that shrinks to a spinner moves
   * everything beside it, and in a confirm dialog that puts the cursor
   * over a different action than the one the user aimed at.
   */
  loading?: boolean;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
}

/*
 * Press feedback is CSS, not a motion component, and that is deliberate:
 * this app has ~220 buttons. `active:scale` compiles to a GPU transform,
 * costs nothing at runtime, works before hydration, and is already
 * neutralised by the global prefers-reduced-motion rule in index.css.
 * Motion is reserved for things that need orchestration — modals, lists,
 * route transitions.
 */
const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[--duration-fast] " +
  "ease-[--ease-out] cursor-pointer select-none " +
  "active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // The accent's primary job. One of these per screen, ideally.
  primary: "bg-accent text-ground hover:bg-accent-hover shadow-sm",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-raised",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-raised",
  // Semantic, not decorative: destructive / approve actions only.
  danger: "bg-negative text-ground hover:brightness-110 shadow-sm",
  positive: "bg-positive text-ground hover:brightness-110 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  // Square. For a bare icon, where horizontal padding would make it oblong.
  icon: "h-10 w-10 p-0",
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    block = false,
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className = "",
    type = "button",
    disabled,
    children,
    ...props
  },
  ref
) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`}
      {...props}
    >
      {/* The label stays in flow but goes invisible, so the button holds its
          exact width while the spinner is overlaid on top. */}
      <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>
        {Icon && <Icon size={iconSize} aria-hidden="true" />}
        {children}
        {IconRight && <IconRight size={iconSize} aria-hidden="true" />}
      </span>

      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </button>
  );
});
