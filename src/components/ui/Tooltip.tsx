import React, { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Tooltip.
 *
 * Opens on hover *and* on keyboard focus — a tooltip that only responds to
 * a pointer is invisible to anyone navigating by keyboard, which usually
 * means the explanation for a bare icon button is unreachable for them.
 *
 * It is `role="tooltip"` wired through `aria-describedby`, so it
 * supplements the trigger's name rather than replacing it. Never put an
 * action or the control's only label in here — touch devices have no hover,
 * so anything that exists solely in a tooltip does not exist on a phone.
 */

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  /** Delay before opening, ms. Prevents flicker when sweeping across a row. */
  delay?: number;
}

const sides = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const offsets = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
};

export function Tooltip({ content, children, side = "top", delay = 150 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const id = useId();

  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      // Escape closes without moving focus — the WAI-ARIA requirement for
      // a tooltip that might be covering something the user wants to read.
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
      }}
    >
      {React.cloneElement(children, { "aria-describedby": open ? id : undefined } as never)}

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            id={id}
            initial={{ opacity: 0, scale: 0.96, ...offsets[side] }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, ...offsets[side] }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={
              `pointer-events-none absolute z-[300] w-max max-w-[15rem] rounded-lg border border-line ` +
              `bg-overlay px-2.5 py-1.5 text-xs leading-snug text-ink shadow-lg ${sides[side]}`
            }
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
