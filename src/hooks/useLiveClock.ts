import { useSyncExternalStore } from "react";

/**
 * A slow clock (60s) so investment & copy-trade progress/countdown keep
 * advancing during a long-open session without a refetch. 60s is far below
 * the churn threshold that caused bug #14 (that was a ~2s market tick).
 *
 * Module-level rather than per-component state: investments and copy trades
 * live in separate domain providers now, and two independent intervals would
 * tick out of phase. One store, one interval, both derive from the same
 * instant — same as when they shared one `useState` before the split. The
 * interval only runs while something is subscribed.
 */
let now = Date.now();
const subscribers = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      subscribers.forEach(notify => notify());
    }, 60000);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};

const getSnapshot = () => now;

export function useLiveClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
