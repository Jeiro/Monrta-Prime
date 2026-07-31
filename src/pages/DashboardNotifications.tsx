import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, CheckCircle2, Info, Trash2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import type { NotificationItem, NotificationType } from "../services";
import { formatRelativeTimestamp } from "../services";

interface DashboardNotificationsProps {
  onNavigate: (view: string) => void;
}

const PAGE_SIZE = 12;

const typeStyles: Record<NotificationType, { icon: React.ReactNode; tone: string; dot: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400"
  },
  info: {
    icon: <Info size={18} />,
    tone: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    dot: "bg-sky-400"
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    tone: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400"
  },
  error: {
    icon: <XCircle size={18} />,
    tone: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-400"
  }
};

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification
  } = useApp();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount]
  );

  const handleAction = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    if (notification.action?.view) {
      onNavigate(notification.action.view);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-6"
    >
      <div className="flex flex-col gap-3 border-b border-line/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-accent">
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-2xs font-black text-ground">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Notification Center</h1>
            <p className="mt-1 text-xs text-muted">
              {unreadNotificationsCount ? `${unreadNotificationsCount} unread update${unreadNotificationsCount === 1 ? "" : "s"}` : "All caught up"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllNotificationsRead}
          disabled={!unreadNotificationsCount}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink transition-all hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/40 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel text-muted">
            <Bell size={24} />
          </div>
          <h2 className="text-lg font-bold text-ink">No notifications yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Account activity, reviews, bulletins, and trade lifecycle updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => {
            const style = typeStyles[notification.type];
            return (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 transition-all ${notification.read ? "border-line bg-surface/55" : "border-accent/40 bg-accent/5 shadow-[0_0_24px_rgba(106,165,255,0.08)]"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.tone}`}>
                      {style.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.read && <span className={`h-2 w-2 rounded-full ${style.dot}`} />}
                        <h2 className="text-sm font-bold text-ink">{notification.title}</h2>
                        <span className="text-2xs uppercase tracking-wide text-muted">{notification.type}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-300">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted">{formatRelativeTimestamp(notification.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    {notification.action && (
                      <button
                        type="button"
                        onClick={() => handleAction(notification)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {notification.action.label}
                        <ArrowRight size={13} />
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(notification.id)}
                        className="rounded-lg border border-line bg-panel p-2 text-muted transition-colors hover:text-emerald-400"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="rounded-lg border border-line bg-panel p-2 text-muted transition-colors hover:text-rose-400"
                      title="Delete notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleCount < notifications.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                className="rounded-xl border border-line bg-surface px-5 py-2.5 text-xs font-bold text-ink transition-all hover:border-accent/50 hover:text-accent"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
