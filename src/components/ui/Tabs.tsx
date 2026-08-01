import React, { useRef } from "react";
import { motion } from "motion/react";

/**
 * Tabs.
 *
 * The active indicator is a single shared element that slides between tabs
 * (`layoutId`) rather than one indicator per tab fading in and out. That is
 * the whole difference between "a thing moved" and "a thing blinked" — it
 * keeps the user's eye anchored on the control instead of asking them to
 * re-find it after every switch.
 *
 * Keyboard model follows the WAI-ARIA tabs pattern: arrows move between
 * tabs, Home/End jump to the ends, and only the active tab is in the tab
 * order, so Tab moves past the strip into the panel rather than through
 * every tab in it.
 */

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  /** Count or status shown after the label. */
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** "line" for page-level sections, "pill" for filters inside a card. */
  variant?: "line" | "pill";
  /** Unique per tab strip on the page — keeps sliding indicators separate. */
  layoutGroup?: string;
  className?: string;
  "aria-label"?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = "line",
  layoutGroup = "tabs",
  className = "",
  "aria-label": ariaLabel,
}: TabsProps<T>) {
  const stripRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const enabled = items.filter((i) => !i.disabled);
    const index = enabled.findIndex((i) => i.id === value);
    if (index === -1) return;

    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    if (next === null) return;

    event.preventDefault();
    onChange(enabled[next].id);
    // Move real focus too, or the screen reader stays on the old tab.
    stripRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
      [items.findIndex((i) => i.id === enabled[next!].id)]?.focus();
  };

  const isLine = variant === "line";

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={
        (isLine
          ? "flex items-center gap-1 border-b border-line "
          : "inline-flex items-center gap-1 rounded-lg border border-line bg-panel p-1 ") +
        // Long strips scroll rather than wrap — a tab strip that wraps to
        // two lines stops reading as one control.
        "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
        className
      }
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={
              "relative flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium " +
              "transition-colors duration-[--duration-fast] cursor-pointer " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
              "disabled:cursor-not-allowed disabled:opacity-40 " +
              (isLine ? "px-3.5 py-2.5 " : "rounded-md px-3.5 py-1.5 ") +
              (active ? "text-ink" : "text-muted hover:text-ink")
            }
          >
            {active && (
              <motion.span
                layoutId={`${layoutGroup}-indicator`}
                transition={{ type: "spring", stiffness: 480, damping: 40 }}
                className={
                  isLine
                    ? "absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
                    : "absolute inset-0 rounded-md border border-line bg-raised"
                }
              />
            )}
            <span className="relative z-10">{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span
                className={
                  "relative z-10 rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums " +
                  (active ? "bg-accent-soft text-accent" : "bg-raised text-muted")
                }
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Panel matching a Tabs item. Wire `id`/`labelledBy` via the item id. */
export function TabPanel({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
