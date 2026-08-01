import React, { useId } from "react";

/**
 * A grid of mutually exclusive choices — deposit asset, withdrawal method,
 * USDT network.
 *
 * These were three separate hand-rolled grids of `<button>`s with identical
 * styling and no grouping semantics: a screen reader heard seven unrelated
 * buttons and no indication that picking one deselects the others, or which
 * one was currently active.
 *
 * It's a real `radiogroup` with roving focus, so arrow keys move between
 * options the way they do in every native radio group, and only the
 * selected option sits in the tab order.
 */

export interface Choice<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface ChoiceGridProps<T extends string> {
  label: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Tailwind grid-cols utilities. */
  columns?: string;
  className?: string;
}

export function ChoiceGrid<T extends string>({
  label,
  choices,
  value,
  onChange,
  columns = "grid-cols-2 sm:grid-cols-4 md:grid-cols-7",
  className = "",
}: ChoiceGridProps<T>) {
  const groupId = useId();

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % choices.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + choices.length) % choices.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = choices.length - 1;
    if (next === null) return;

    event.preventDefault();
    onChange(choices[next].value);
    (event.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
  };

  return (
    <div className={className}>
      <span id={groupId} className="mb-2 block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={groupId} className={`grid gap-2 ${columns}`}>
        {choices.map((choice, index) => {
          const selected = choice.value === value;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(choice.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={
                "rounded-lg border px-2 py-2.5 text-center text-2xs font-semibold " +
                "transition-colors duration-[--duration-fast] cursor-pointer " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                (selected
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-panel text-muted hover:border-line-strong hover:text-ink")
              }
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
