import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A titled panel with an optional action in the header.
 *
 * Four of these on Dashboard Overview alone, each previously rebuilt by
 * hand with its own padding, its own divider opacity (`border-line/60` vs
 * `/50` vs none) and its own "View all" link styling. The divider and the
 * gap between header and body are the two things that most visibly drift
 * when this is copy-pasted, so they live here.
 *
 * The header action is a `<button>` styled as a quiet link rather than a
 * Button variant: it's navigation to a fuller view, not an action on this
 * panel's content, and giving it button chrome makes it compete with the
 * real actions inside the card.
 */

// `title` is omitted from HTMLAttributes: there it's the tooltip attribute
// (a string), here it's the card's heading (a node). Keeping both under one
// name would silently coerce a JSX heading into a stringified tooltip.
export interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  icon?: LucideIcon;
  /** Right-aligned header slot — usually a "View all" link. */
  action?: React.ReactNode;
  as?: "section" | "div";
  /** Removes body padding, for a card whose body is an edge-to-edge table. */
  flush?: boolean;
}

export function SectionCard({
  title,
  icon: Icon,
  action,
  as: Tag = "section",
  flush = false,
  className = "",
  children,
  ...props
}: SectionCardProps) {
  return (
    <Tag
      className={`rounded-xl border border-line bg-surface ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon size={15} className="shrink-0 text-faint" aria-hidden="true" />}
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        </div>
        {action}
      </div>

      <div className={flush ? "" : "p-5"}>{children}</div>
    </Tag>
  );
}

/** Quiet navigational link for a SectionCard header. */
export function SectionCardAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-sm text-xs font-medium text-muted transition-colors duration-[--duration-fast] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
    >
      {children}
    </button>
  );
}
