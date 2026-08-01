import React, { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Select.
 *
 * Wraps the native <select> rather than reimplementing a listbox in divs.
 * On phones that means the OS picker — the drum on iOS, the sheet on
 * Android — which is faster, reachable one-handed, and works with the
 * platform's own accessibility stack. A custom dropdown would look more
 * "designed" and be worse everywhere it matters.
 *
 * The chevron is ours; `appearance-none` removes the platform one so the
 * control matches Input's height, radius and focus ring exactly.
 */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = "", id, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedById = error ? `${selectId}-err` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={
            "w-full appearance-none rounded-lg border bg-panel px-3 py-2.5 pr-9 text-sm text-ink " +
            "transition-colors duration-[--duration-fast] cursor-pointer " +
            "focus:outline-none focus:ring-2 " +
            (error
              ? "border-negative focus:border-negative focus:ring-negative/20 "
              : "border-line focus:border-accent focus:ring-accent/20 ") +
            "disabled:cursor-not-allowed disabled:opacity-45 " +
            // Native option lists inherit the OS palette, not ours — this
            // is the one hook browsers give us to keep them on-theme.
            "[&>option]:bg-overlay [&>option]:text-ink " +
            className
          }
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        />
      </div>

      {error ? (
        <span id={`${selectId}-err`} className="text-xs text-negative">
          {error}
        </span>
      ) : hint ? (
        <span id={`${selectId}-hint`} className="text-xs text-faint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
