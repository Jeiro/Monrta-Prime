import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Shown under the field. Replaced by `error` when one is present. */
  hint?: string;
  error?: string;
  /** Right-aligned tabular figures — use for amounts, not for text. */
  numeric?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, numeric = false, className = "", id, ...props },
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
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={
          "w-full rounded-lg border bg-panel px-3 py-2.5 text-sm text-ink " +
          "placeholder:text-faint transition-colors duration-200 " +
          "focus:outline-none focus:ring-2 " +
          (error
            ? "border-negative focus:border-negative focus:ring-negative/20 "
            : "border-line focus:border-accent focus:ring-accent/20 ") +
          "disabled:cursor-not-allowed disabled:opacity-45 " +
          (numeric ? "font-data tabular-nums text-right " : "") +
          className
        }
        {...props}
      />
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
