import React from "react";

/**
 * Layout primitives.
 *
 * Before these, every section on the public pages set its own vertical
 * padding by hand — py-12, py-16, pt-10 pb-12, py-20 md:py-32, py-16 md:py-24
 * — which is where most of the home page's dead space came from (~1,650px of
 * section padding alone). Three density steps, and nothing sets py-* directly.
 */

type Density = "tight" | "normal" | "loose";

const densities: Record<Density, string> = {
  tight: "py-10",       // 40px — stacked sibling sections, dense lists
  normal: "py-16",      // 64px — the default
  loose: "py-20 md:py-22", // 88px — reserved for the hero and final CTA only
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  density?: Density;
  /** Hairline top border. Use to separate adjacent sections of equal weight. */
  divided?: boolean;
  as?: "section" | "div" | "footer";
}

export function Section({
  density = "normal",
  divided = false,
  as: Tag = "section",
  className = "",
  children,
  ...props
}: SectionProps) {
  return (
    <Tag
      className={`relative w-full ${densities[density]} ${divided ? "border-t border-line/60" : ""} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

type Width = "narrow" | "content" | "wide" | "full";

const widths: Record<Width, string> = {
  narrow: "max-w-2xl",   // prose, forms
  content: "max-w-4xl",  // centred marketing copy
  wide: "max-w-7xl",     // tables, dashboards, card grids
  full: "max-w-none",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: Width;
}

/** Single source of truth for horizontal gutters. */
export function Container({ width = "wide", className = "", ...props }: ContainerProps) {
  return <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${widths[width]} ${className}`} {...props} />;
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * Section headings were built ad-hoc on every page, each with its own
 * eyebrow pill, heading size and bottom margin. One component means the
 * rhythm between heading and content is identical everywhere.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col gap-3 ${centered ? "items-center text-center" : "items-start text-left"} ${className}`}
    >
      {eyebrow && (
        <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink text-balance">
        {title}
      </h2>
      {description && (
        <p className={`text-base leading-relaxed text-muted ${centered ? "max-w-2xl" : "max-w-xl"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Consistent gap between a SectionHeading and the block beneath it. */
export function SectionBody({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-10 ${className}`} {...props} />;
}
