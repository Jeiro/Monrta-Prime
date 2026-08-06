import React, { useMemo, useState } from "react";
import { Section, Container, SectionHeading } from "../ui/Layout";
import { formatMoney } from "../../lib/format";

/**
 * Compounding projection.
 *
 * Client-side only, and deliberately framed as an illustration rather than
 * a quote. The APY is a slider, not a fixed headline number, so the page
 * never states a rate the platform would have to honour — the visitor
 * chooses the assumption and sees the arithmetic that follows from it.
 *
 * The disclaimer under the result is load-bearing, not boilerplate. This is
 * a financial projection on a public marketing page; leave it in place.
 */

const HORIZONS = [1, 3, 5] as const;
type Horizon = (typeof HORIZONS)[number];

const MIN = 1000;
const MAX = 500000;

export const YieldCalculator: React.FC = () => {
  const [deposit, setDeposit] = useState(25000);
  const [years, setYears] = useState<Horizon>(3);
  const [apy, setApy] = useState(12.4);

  const { total, gain, growthPct } = useMemo(() => {
    const t = deposit * Math.pow(1 + apy / 100, years);
    const g = t - deposit;
    return { total: t, gain: g, growthPct: (g / deposit) * 100 };
  }, [deposit, years, apy]);

  // Fills the track up to the thumb — a plain range input gives no sense of
  // where the value sits within its bounds.
  const trackFill = (value: number, min: number, max: number) =>
    ({
      background: `linear-gradient(90deg, var(--mp-accent) ${((value - min) / (max - min)) * 100}%, var(--mp-line) ${((value - min) / (max - min)) * 100}%)`,
    }) as React.CSSProperties;

  const rangeClass =
    "h-1.5 w-full cursor-pointer appearance-none rounded-full " +
    "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent " +
    "[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-ground " +
    "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-ground [&::-moz-range-thumb]:bg-accent";

  return (
    <Section divided className="bg-ground" id="rates">
      <Container>
        <SectionHeading
          eyebrow="Projection"
          title="Model a position before you fund it"
          description="Adjust the deposit, horizon and rate to see how compounding behaves. Illustrative only — not a quoted or guaranteed return."
        />

        <div className="mt-11 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <div className="mb-7">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <label
                  htmlFor="mp-deposit"
                  className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint"
                >
                  Deposit amount
                </label>
                <span className="font-data text-2xl font-semibold tabular-nums tracking-tight text-ink">
                  {formatMoney(deposit)}
                </span>
              </div>
              <input
                id="mp-deposit"
                type="range"
                min={MIN}
                max={MAX}
                step={1000}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className={rangeClass}
                style={trackFill(deposit, MIN, MAX)}
              />
              <div className="mt-2 flex justify-between font-data text-2xs text-faint">
                <span>{formatMoney(MIN)}</span>
                <span>{formatMoney(MAX)}</span>
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                Time horizon
              </p>
              <div className="flex gap-2" role="group" aria-label="Time horizon">
                {HORIZONS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    aria-pressed={years === y}
                    onClick={() => setYears(y)}
                    className={
                      "flex-1 cursor-pointer rounded-lg border py-2.5 text-sm font-semibold transition-colors " +
                      (years === y
                        ? "border-accent bg-accent text-ground"
                        : "border-line bg-raised text-muted hover:text-ink")
                    }
                  >
                    {y} {y === 1 ? "year" : "years"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <label
                  htmlFor="mp-apy"
                  className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint"
                >
                  Assumed APY
                </label>
                <span className="font-data text-2xl font-semibold tabular-nums tracking-tight text-ink">
                  {apy.toFixed(2)}%
                </span>
              </div>
              <input
                id="mp-apy"
                type="range"
                min={2}
                max={25}
                step={0.1}
                value={apy}
                onChange={(e) => setApy(Number(e.target.value))}
                className={rangeClass}
                style={trackFill(apy, 2, 25)}
              />
              <div className="mt-2 flex justify-between font-data text-2xs text-faint">
                <span>2.0%</span>
                <span>25.0%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-accent-line bg-gradient-to-br from-accent-soft to-surface p-7">
            <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              Projected balance
            </p>
            <p
              className="my-1.5 font-data text-[clamp(2.1rem,4.4vw,3.1rem)] font-semibold tabular-nums leading-none tracking-tight text-ink"
              aria-live="polite"
            >
              {formatMoney(total)}
            </p>
            <p className="font-data text-sm font-semibold text-positive">
              +{formatMoney(gain)} compounded
            </p>

            <dl className="mt-6 grid gap-3 border-t border-accent-line pt-5">
              {[
                ["Initial deposit", formatMoney(deposit)],
                ["Interest earned", formatMoney(gain)],
                ["Effective growth", `+${growthPct.toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-data font-medium tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-2xs leading-relaxed text-faint">
              Figures are a compounding illustration at the rate you selected. They are not a
              forecast, an offer, or a guaranteed rate of return.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
};
