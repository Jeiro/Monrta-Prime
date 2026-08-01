import React, { useState, useRef, useEffect } from "react";
import { useSession } from "../../../context/domains/SessionContext";
import { useAdminUsers } from "../../../context/domains/AdminUsersContext";
import { useWallet } from "../../../context/domains/WalletContext";
import { useSupport } from "../../../context/domains/SupportContext";
import { useInvestmentPlans } from "../../../context/domains/InvestmentPlansContext";
import { InvestmentPlan } from "../../../types";
import { motion } from "motion/react";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Bell, Volume2, ShieldAlert, 
  MessageSquare, Activity, UserCheck, Ban, PenTool, Check, X, Menu, CreditCard, 
  Key, Database, Search, Plus, Trash2, FileText, Lock, Compass, DollarSign, Award, Gift
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { Button } from "../../ui";

const AdminVolumeChart: React.FC<{ chartData: any[] }> = ({ chartData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSize, setHasSize] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const updateSize = () => setHasSize(node.clientWidth > 0 && node.clientHeight > 0);
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

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-ink">In/Out Volume Breakdown</h3>
        <p className="text-2xs text-muted mt-1">Comparisons of total accepted deposits against total settled withdrawals.</p>
      </div>
      <div ref={containerRef} className="h-[200px] mt-4 w-full">
        {hasSize ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            {/* Every colour here is a CSS custom property rather than a hex.
                Recharts writes these straight into SVG presentation attributes
                and inline styles, which resolve against the nearest
                [data-theme] scope — so the chart re-colours on a theme switch
                with no re-render and no JS reading the theme at all. Same
                approach as DashboardEquityChart. The previous hardcoded values
                (#222 grid, #666/#ccc axes, #111 tooltip) were dark-only and
                left the gridlines and axis text nearly invisible in light. */}
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mp-line)" horizontal={false} />
              <XAxis type="number" stroke="var(--mp-line-strong)" tick={{ fill: "var(--mp-faint)", fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="var(--mp-line-strong)" tick={{ fill: "var(--mp-muted)", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--mp-overlay)",
                  borderColor: "var(--mp-line)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "var(--mp-shadow-lg)"
                }}
                itemStyle={{ color: "var(--mp-ink)" }}
                labelStyle={{ color: "var(--mp-muted)" }}
                cursor={{ fill: "var(--mp-raised)" }}
                formatter={(val: any) => `$${Number(val).toLocaleString()}`}
              />
              <Bar dataKey="volume" fill="var(--mp-accent)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
};


export const AdminOverviewTab: React.FC = () => {
  const { user: currentUser } = useSession();
  const { usersDirectory } = useAdminUsers();
  const { adminTransactions } = useWallet();
  const { supportTickets } = useSupport();
  const { plans } = useInvestmentPlans();

  const usersList = usersDirectory || [];
  const aggregateUsers = usersList.length + 10;
  const activeUserCount = usersList.filter(u => u.status === "active").length + 8;
  const bannedCount = usersList.filter(u => u.status === "banned").length;

  // adminTransactions/supportTickets already cover every user (including the
  // signed-in admin) when the caller is an admin, so no separate merge of
  // currentUser.transactions/tickets is needed here.
  const allDeposits = adminTransactions.filter(t => t.type === "deposit");
  const allWithdrawals = adminTransactions.filter(t => t.type === "withdrawal");
  const allTickets = supportTickets;

  const sortedDeposits = [...allDeposits].sort((a,b) => b.id.localeCompare(a.id));
  const sortedWithdrawals = [...allWithdrawals].sort((a,b) => b.id.localeCompare(a.id));
  const sortedTickets = [...allTickets].sort((a,b) => b.status === "open" ? -1 : 1);

  const totalDepositVolume = allDeposits
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 1450000;

  const totalWithdrawalVolume = allWithdrawals
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 210000;

  const totalInvestmentsPlaced = (plans?.length || 0) * 48000 + 482900;
  const platformHedgedRevenue = totalDepositVolume * 0.08;
  const pendingPayoutCount = sortedWithdrawals.filter(w => w.status === "pending").length;

  const chartData = [
    { name: "Deposits", volume: totalDepositVolume },
    { name: "Withdrawals", volume: totalWithdrawalVolume }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Network Volume", val: `$${totalDepositVolume.toLocaleString()}`, change: "+14.2%", icon: Activity, color: "text-positive" },
                { label: "Active Investors", val: activeUserCount, change: "+5.8%", icon: Users, color: "text-accent" },
                { label: "Pending Payouts", val: pendingPayoutCount, change: "-2", icon: ArrowUpRight, color: "text-accent" },
                { label: "Total Asset Investments", val: `$${totalInvestmentsPlaced.toLocaleString()}`, change: "+22%", icon: Layers, color: "text-ink" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-surface border border-line rounded-2xl p-5 flex flex-col justify-between h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted font-bold uppercase tracking-wider">{stat.label}</span>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-ink font-data">{stat.val}</span>
                    <span className="text-2xs font-bold text-positive">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-ground border border-line/50 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.location.hash = "#users"}>
                <Users size={14} className="text-accent" />
                Manage Users
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.location.hash = "#deposits"}>
                <ArrowDownLeft size={14} className="text-positive" />
                Review Invoices
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => window.location.hash = "#support"}>
                <MessageSquare size={14} className="text-accent" />
                Support Desk
              </Button>
            </div>

            {/* Platform Financial Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-surface border border-line rounded-2xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-ink">Platform Fiscal Hedging</h3>
                  <span className="text-2xs uppercase font-bold text-accent border border-accent/30 bg-accent/10 px-2 py-0.5 rounded-full">Automated Mode</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-faint font-medium uppercase tracking-wider">Hedged Revenue Base</span>
                    <span className="font-bold text-positive font-data text-sm">+${platformHedgedRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-faint font-medium uppercase tracking-wider">Projected Next Month</span>
                    <span className="font-bold text-ink font-data text-sm">+${(platformHedgedRevenue * 1.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-faint font-medium uppercase tracking-wider">System Yield Rate</span>
                    <span className="font-bold text-accent font-data text-sm">4.2%</span>
                  </div>
                  
                  <div className="pt-4 border-t border-line/40 mt-4">
                    <Button size="sm" block>
                      Export Hedging Log
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Recharts Graph */}
              <AdminVolumeChart chartData={chartData} />

            </div>
          </div>
    </motion.div>
  );
};
