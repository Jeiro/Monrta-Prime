import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";

/**
 * Dialog.
 *
 * On phones this is a bottom sheet, not a shrunken desktop modal. That's not
 * decoration — a centred box on a 375px screen puts its actions in the middle
 * of the display, the hardest place to reach one-handed, and gets its top
 * edge covered the moment the keyboard opens. The sheet keeps actions in the
 * thumb zone and grows upward from the bottom, which is also the direction
 * it entered from, so the movement stays coherent.
 *
 * Behaviour that every dialog gets for free: focus trapped and restored,
 * Escape to close, backdrop click to close, body scroll locked, and a
 * portal so no ancestor's `overflow` or `transform` can clip it.
 */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned action row. Stays visible while the body scrolls. */
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /**
   * Set false for dialogs that must be resolved by choosing an action —
   * an irreversible confirm, not a "here's some info" panel. Disables
   * Escape and backdrop dismissal.
   */
  dismissible?: boolean;
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
          {/* Backdrop. Blur is kept low — a heavy blur on a full-page
              backdrop is one of the most expensive things you can ask a
              mobile GPU to composite every frame. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={dismissible ? onClose : undefined}
            className="absolute inset-0 bg-ground/70 backdrop-blur-[3px]"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            // Sheet rises from the bottom on mobile; on desktop it settles
            // in place with a slight lift. Both are transform+opacity only.
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={
              `relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-overlay shadow-2xl ` +
              `rounded-t-2xl sm:rounded-2xl ${sizes[size]}`
            }
          >
            {/* Grab handle. Mobile only — it signals "this dismisses
                downward" without needing a visible close button up top. */}
            {dismissible && (
              <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
                <div className="h-1 w-9 rounded-full bg-line-strong" />
              </div>
            )}

            {(title || dismissible) && (
              <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-1 text-sm leading-relaxed text-muted">
                      {description}
                    </p>
                  )}
                </div>

                {dismissible && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-line bg-overlay px-5 py-4 pb-safe sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Edge-anchored panel — filters, detail views, anything that should keep the
 * page visible behind it rather than replacing it the way a dialog does.
 */
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
}

export function Drawer({ open, onClose, title, children, footer, side = "right" }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  const offscreen = side === "right" ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ground/70 backdrop-blur-[3px]"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={
              `absolute inset-y-0 flex w-full max-w-md flex-col border-line bg-overlay shadow-2xl ` +
              (side === "right" ? "right-0 border-l" : "left-0 border-r")
            }
          >
            {title && (
              <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
            {footer && (
              <div className="shrink-0 border-t border-line px-5 py-4 pb-safe">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
