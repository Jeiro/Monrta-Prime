import React from "react";
import { useApp } from "../../../context/AppContext";
import { motion } from "motion/react";
import { ShieldAlert, AlertTriangle, Check, Info } from "lucide-react";
import { formatDateTime } from "../../../lib/format";

export const AdminSecurityTab: React.FC = () => {
  const { adminAuditLogs } = useApp();

  const statusIcons: Record<string, React.ReactNode> = {
    success: <Check size={12} className="text-positive" />,
    warning: <AlertTriangle size={12} className="text-yellow-400" />,
    alert: <ShieldAlert size={12} className="text-negative" />
  };

  const statusColors: Record<string, string> = {
    success: "border-positive/20 bg-positive/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    alert: "border-negative/20 bg-negative/5"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <h1 className="text-xl font-bold text-ink flex items-center gap-2">
          <ShieldAlert size={20} className="text-negative" /> Security & Audit Logs
        </h1>
        <p className="text-xs text-muted mt-1">Complete chronological record of all administrative actions and system events.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: adminAuditLogs.length, color: "text-accent" },
          { label: "Warnings", value: adminAuditLogs.filter(l => l.status === "warning").length, color: "text-yellow-400" },
          { label: "Alerts", value: adminAuditLogs.filter(l => l.status === "alert").length, color: "text-negative" }
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-line rounded-xl p-4 flex items-center justify-between">
            <span className="text-2xs text-muted uppercase font-bold">{s.label}</span>
            <span className={`text-xl font-bold font-data ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {adminAuditLogs.slice(0, 100).map(log => (
          <div key={log.id} className={`bg-surface border rounded-xl p-4 ${statusColors[log.status]}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-ground/80 border border-line/50">
                  {statusIcons[log.status]}
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{log.action}</p>
                  <p className="text-2xs text-muted mt-0.5 leading-relaxed">{log.details}</p>
                </div>
              </div>
              <div className="text-right text-2xs text-muted shrink-0 space-y-0.5">
                <p className="font-bold text-ink">{formatDateTime(log.timestamp)}</p>
                <p>{log.email}</p>
                <p className="font-mono">{log.ip}</p>
              </div>
            </div>
          </div>
        ))}

        {adminAuditLogs.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No audit logs recorded yet.</div>
        )}
      </div>
    </motion.div>
  );
};
