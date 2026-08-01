import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { motion } from 'motion/react';
import { Tabs } from '../ui/Tabs';

interface DashboardEquityChartProps {
  currentEquity: number;
}

const RANGES = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const;
type RangeKey = keyof typeof RANGES;

export const DashboardEquityChart: React.FC<DashboardEquityChartProps> = ({ currentEquity }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Recharts is given explicit pixel dimensions rather than width="100%"
  // height="100%". With percentages it measures its own parent, and during the
  // first paint after this gate flips it reads back -1, which is the
  // "width(-1) and height(-1) of chart should be greater than 0" warning.
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hasSize = size.w > 0 && size.h > 0;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const w = Math.floor(node.clientWidth);
      const h = Math.floor(node.clientHeight);
      setSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    const rafId = window.requestAnimationFrame(updateSize);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => window.requestAnimationFrame(updateSize)) : null;

    if (resizeObserver) {
      resizeObserver.observe(node);
    } else {
      const timeoutId = window.setTimeout(updateSize, 50);
      window.addEventListener("resize", updateSize);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("resize", updateSize);
        window.cancelAnimationFrame(rafId);
      };
    }

    return () => {
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Mock 30-day curve shape, generated ONCE per mount as multipliers of the
  // current equity. currentEquity changes on every market tick (~4.5s), so
  // regenerating the random walk from it — the previous code — made the
  // whole chart visibly reroll with new random history every few seconds.
  const shapeFactorsRef = useRef<number[] | null>(null);
  if (!shapeFactorsRef.current) {
    // A full year of daily factors so every range slices from ONE walk —
    // switching 7D -> 30D shows the same history at wider zoom, instead of
    // each range inventing an unrelated past.
    const factors: number[] = [];
    let rolling = 0.55;
    for (let i = 365; i >= 0; i--) {
      if (i === 0) {
        rolling = 1;
      } else {
        // Random daily fluctuation between -2% and +3.5%
        rolling = rolling * (1 + (Math.random() * 0.055 - 0.02));
      }
      factors.push(rolling);
    }
    // Normalise so the walk ends exactly at the live equity without a jump.
    const last = factors[factors.length - 2] || 1;
    shapeFactorsRef.current = factors.map((f, i) =>
      i === factors.length - 1 ? 1 : f / last);
  }

  const [range, setRange] = useState<RangeKey>("30D");
  const data = useMemo(() => {
    const days = RANGES[range];
    const factors = shapeFactorsRef.current!.slice(-(days + 1));
    const now = new Date();
    return factors.map((factor, idx) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (factors.length - 1 - idx));
      return {
        name: days > 120
          ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Equity: Number((currentEquity * factor).toFixed(2))
      };
    });
  }, [currentEquity, range]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      // The figure wears an ink token, not the series colour. Colour on a
      // number reads as a status ("is this bad?"); identity belongs to the
      // mark, and with a single series the title already names it.
      <div className="rounded-lg border border-line bg-overlay px-3 py-2 shadow-lg">
        <p className="mb-0.5 font-sans text-2xs text-muted">{label}</p>
        <p className="font-data text-sm font-semibold tabular-nums text-ink">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  };

  // Compact axis figures — "$62k" instead of "$62,000". The Y axis is a scale
  // reference, not a place to read exact values; the tooltip is for that, and
  // full figures here cost ~40px of chart width on a phone.
  const compact = (value: number) =>
    `$${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full h-[268px] mt-4 flex flex-col"
    >
      <div className="mb-2 flex justify-end">
        <Tabs<RangeKey>
          items={(Object.keys(RANGES) as RangeKey[]).map((k) => ({ id: k, label: k }))}
          value={range}
          onChange={setRange}
          variant="pill"
          layoutGroup="equity-range"
          aria-label="Chart time range"
          className="text-2xs"
        />
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-0">
        {hasSize ? (
          <ResponsiveContainer width={size.w} height={size.h}>
            {/* left:-20 pulled the Y axis off the canvas, so "$60,000" rendered
                as "0,000" with the leading digit clipped; right:0 cut the last
                X label ("Jul 31" -> "Jul 3"). The axis reserves its own width
                instead. */}
            <AreaChart
              data={data}
              margin={{ top: 10, right: 28, left: 0, bottom: 0 }}
            >
              {/* Every colour below is a CSS custom property rather than a
                  hex. Recharts writes these straight into SVG presentation
                  attributes, which resolve against the nearest [data-theme]
                  scope — so the chart re-colours on a theme switch with no
                  re-render and no JS reading the theme at all. */}
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--mp-accent)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--mp-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mp-line)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--mp-faint)", fontSize: 11, fontFamily: "var(--font-data)" }}
                minTickGap={34}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--mp-faint)", fontSize: 11, fontFamily: "var(--font-data)" }}
                tickFormatter={compact}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--mp-line-strong)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="Equity"
                stroke="var(--mp-accent)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEquity)"
                // 8px marker with a 2px surface ring, so it stays legible
                // where it crosses the line or the grid.
                activeDot={{ r: 4, fill: "var(--mp-accent)", stroke: "var(--mp-surface)", strokeWidth: 2 }}
                animationDuration={650}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </motion.div>
  );
};
