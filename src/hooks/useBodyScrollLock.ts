import { useEffect } from "react";

/**
 * Locks page scroll while `isLocked` is true.
 *
 * Reference-counted, because locks nest. GlobalModals used to lock on
 * "any modal is open" while each Modal also locked on its own `open`. Both
 * captured the previous overflow value and both restored it on cleanup —
 * but the inner one captured "hidden" (the outer had already applied it),
 * and React runs the parent cleanup before the child's. So closing a modal
 * restored "" and then immediately re-applied "hidden", leaving the page
 * permanently unscrollable until a reload.
 *
 * With a counter, the original value is captured once on the first lock and
 * restored once on the last release, so nesting is safe regardless of
 * cleanup order.
 */

let lockCount = 0;
let saved: { bodyOverflow: string; bodyOverflowY: string; rootOverflow: string; rootOverflowY: string } | null =
  null;

function acquire() {
  const body = document.body;
  const root = document.documentElement;

  if (lockCount === 0) {
    saved = {
      bodyOverflow: body.style.overflow,
      bodyOverflowY: body.style.overflowY,
      rootOverflow: root.style.overflow,
      rootOverflowY: root.style.overflowY,
    };
    body.style.overflow = "hidden";
    body.style.overflowY = "hidden";
    root.style.overflow = "hidden";
    root.style.overflowY = "hidden";
  }
  lockCount += 1;
}

function release() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && saved) {
    const body = document.body;
    const root = document.documentElement;
    body.style.overflow = saved.bodyOverflow;
    body.style.overflowY = saved.bodyOverflowY;
    root.style.overflow = saved.rootOverflow;
    root.style.overflowY = saved.rootOverflowY;
    saved = null;
  }
}

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    acquire();
    return release;
  }, [isLocked]);
}
