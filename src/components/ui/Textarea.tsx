import React, { forwardRef, useId } from "react";

/**
 * Multi-line input. Mirrors Input's label/hint/error contract so a form can
 * mix the two without the fields drifting apart visually.
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = "", id, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedById = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={
          "w-full resize-y rounded-lg border bg-panel px-3 py-2.5 text-sm text-ink " +
          "placeholder:text-faint transition-colors duration-[--duration-fast] " +
          "focus:outline-none focus:ring-2 " +
          (error
            ? "border-negative focus:border-negative focus:ring-negative/20 "
            : "border-line focus:border-accent focus:ring-accent/20 ") +
          "disabled:cursor-not-allowed disabled:opacity-45 " +
          className
        }
        {...props}
      />
      {error ? (
        <span id={`${fieldId}-err`} className="text-xs text-negative">
          {error}
        </span>
      ) : hint ? (
        <span id={`${fieldId}-hint`} className="text-xs text-faint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
