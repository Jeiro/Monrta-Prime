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

interface DashboardEquityChartProps {
  currentEquity: number;
}

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
    const factors: number[] = [];
    let rolling = 0.75; // Start at 75% of current equity
    for (let i = 30; i >= 0; i--) {
      if (i === 0) {
        rolling = 1;
      } else {
        // Random daily fluctuation between -2% and +3.5%
        rolling = rolling * (1 + (Math.random() * 0.055 - 0.02));
      }
      factors.push(rolling);
    }
    shapeFactorsRef.current = factors;
  }

  const data = useMemo(() => {
    const factors = shapeFactorsRef.current!;
    const now = new Date();
    return factors.map((factor, idx) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (factors.length - 1 - idx));
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Equity: Number((currentEquity * factor).toFixed(2))
      };
    });
  }, [currentEquity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-line/50 p-3 rounded-lg shadow-xl">
          <p className="text-muted text-xs mb-1 font-sans">{label}</p>
          <p className="text-accent font-data font-bold">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full h-[240px] mt-6"
    >
      <div ref={containerRef} className="w-full h-full">
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
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6AA5FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6AA5FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1C24" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="Equity" 
                stroke="#6AA5FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEquity)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </motion.div>
  );
};
