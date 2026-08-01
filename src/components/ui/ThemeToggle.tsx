import { Monitor, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme, type ThemePreference } from "../../context/ThemeContext";

/**
 * Theme control, in two shapes.
 *
 * "icon" — a single button for the nav bar. Toggles light/dark directly;
 *   one tap, no menu. The icon shows the theme you'd GET, not the one
 *   you're in, which is the convention users already have from iOS and
 *   every browser.
 *
 * "segmented" — the full three-state control for Settings, where "system"
 *   needs to be reachable and labelled.
 */

const SWAP = {
  initial: { opacity: 0, rotate: -75, scale: 0.7 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 75, scale: 0.7 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      // The label states the ACTION, not the state — a screen reader user
      // needs to know what pressing it does.
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={
        "relative grid h-9 w-9 place-items-center rounded-lg text-muted " +
        "transition-colors duration-[--duration-fast] " +
        "hover:bg-raised hover:text-ink " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        "cursor-pointer " +
        className
      }
    >
      {/* Sized wrapper so the swapping icons don't reflow the button. */}
      <span className="relative block h-[18px] w-[18px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={theme} {...SWAP} className="absolute inset-0 grid place-items-center">
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeSegmentedToggle({ className = "" }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`inline-flex items-center gap-1 rounded-lg border border-line bg-panel p-1 ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={
              "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium " +
              "transition-colors duration-[--duration-fast] cursor-pointer " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
              (active ? "text-ink" : "text-muted hover:text-ink")
            }
          >
            {/* The pill slides between options rather than cross-fading —
                shared layout is what makes it read as one moving object. */}
            {active && (
              <motion.span
                layoutId="theme-segment"
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-md border border-line bg-raised"
              />
            )}
            <Icon size={13} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
