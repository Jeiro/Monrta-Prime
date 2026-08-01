import React, { forwardRef, useId } from "react";

// `prefix`/`suffix` are omitted from InputHTMLAttributes: there they're the
// rarely-used HTML string attributes, here they're rendered nodes. Sharing
// the names would coerce a JSX unit into a stringified DOM attribute.
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  /** Shown under the field. Replaced by `error` when one is present. */
  hint?: string;
  error?: string;
  /** Right-aligned tabular figures — use for amounts, not for text. */
  numeric?: boolean;
  /**
   * Fixed unit shown inside the field, e.g. "$". Decoration, not input:
   * it sits outside the tab order and is hidden from screen readers, which
   * take the unit from the label instead ("Amount (USD)"). A currency field
   * with no visible unit makes the user guess what they're typing.
   */
  prefix?: React.ReactNode;
  /** Trailing unit, e.g. "USDT" or "%". Same rules as `prefix`. */
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, numeric = false, prefix, suffix, className = "", id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-data text-sm text-muted"
          >
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={
            "w-full rounded-lg border bg-panel py-2.5 text-sm text-ink " +
            "placeholder:text-faint transition-colors duration-[--duration-fast] " +
            "focus:outline-none focus:ring-2 " +
            (prefix ? "pl-8 " : "pl-3 ") +
            (suffix ? "pr-14 " : "pr-3 ") +
            (error
              ? "border-negative focus:border-negative focus:ring-negative/20 "
              : "border-line focus:border-accent focus:ring-accent/20 ") +
            "disabled:cursor-not-allowed disabled:opacity-45 " +
            (numeric ? "font-data tabular-nums text-right " : "") +
            className
          }
          {...props}
        />

        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-semibold uppercase tracking-[0.09em] text-faint"
          >
            {suffix}
          </span>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-err`} className="text-xs text-negative">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-faint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
