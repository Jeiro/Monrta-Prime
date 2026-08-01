import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import type { AuditLog } from "../../types";
import { buildAuditLog } from "../../services";

export type AuditLogStatus = "success" | "warning" | "alert";
export type HandleLog = (action: string, details: string, email: string, logStatus: AuditLogStatus) => void;

// Split in two on purpose. `handleLog` is called from every single domain
// provider, but the log ARRAY is read by one admin tab. Keeping them in one
// context would mean every log write re-rendered every domain provider (and
// therefore every consumer) — the exact churn this split exists to remove.
// The actions context never changes identity; the state context changes on
// each write and only the audit-log reader subscribes to it.
const AuditLogActionsContext = createContext<{ handleLog: HandleLog } | undefined>(undefined);
const AuditLogStateContext = createContext<{ adminAuditLogs: AuditLog[] } | undefined>(undefined);

export const AuditLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("orbitrio_audit_logs");
    return saved ? JSON.parse(saved) : [
      { id: "log-1", action: "System Booted", details: "Moneta Prime financial core initialised on secured cluster nodes.", timestamp: "2026-06-19 00:01:00", email: "system", ip: "127.0.0.1", status: "success" },
      { id: "log-2", action: "Cold Storage Verified", details: "Multi-sig 10-layer physical vaults synchronised and validated.", timestamp: "2026-06-19 00:05:22", email: "sec-op", ip: "10.0.1.5", status: "success" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("orbitrio_audit_logs", JSON.stringify(adminAuditLogs));
  }, [adminAuditLogs]);

  const handleLog = useCallback<HandleLog>((action, details, email, logStatus) => {
    const auditLog = buildAuditLog(action, details, email, logStatus);
    setAdminAuditLogs(prev => [auditLog, ...prev]);
  }, []);

  const actions = useMemo(() => ({ handleLog }), [handleLog]);
  const state = useMemo(() => ({ adminAuditLogs }), [adminAuditLogs]);

  return (
    <AuditLogActionsContext.Provider value={actions}>
      <AuditLogStateContext.Provider value={state}>
        {children}
      </AuditLogStateContext.Provider>
    </AuditLogActionsContext.Provider>
  );
};

/** Write-only handle. Use this inside domain providers — it never re-renders. */
export const useAuditLogWriter = () => {
  const context = useContext(AuditLogActionsContext);
  if (context === undefined) throw new Error("useAuditLogWriter must be used inside an AuditLogProvider");
  return context;
};

/** Read the log itself. Only the admin security tab needs this. */
export const useAuditLog = () => {
  const context = useContext(AuditLogStateContext);
  if (context === undefined) throw new Error("useAuditLog must be used inside an AuditLogProvider");
  return context;
};
