import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Keeps Tab inside a container while it's open, and gives focus back to
 * whatever opened it on close.
 *
 * Without this, tabbing out of a dialog lands you on the page behind it —
 * which is still scroll-locked and visually dimmed, so a keyboard user is
 * driving an interface they cannot see. The restore half matters just as
 * much: closing a dialog and dropping focus to <body> sends the next Tab
 * back to the top of the page, forcing a full re-traverse.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first control, or the container itself if there isn't one
    // (a purely informational dialog still needs to receive focus so a
    // screen reader announces it).
    const initial = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (initial.length > 0) initial[0].focus();
    else container.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      // Re-queried each keypress: dialog contents change (a form reveals a
      // field, a button becomes enabled), and a stale list traps focus on
      // an element that no longer exists.
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
