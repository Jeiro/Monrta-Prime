import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, CheckCircle2, Info, Trash2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { Button, EmptyState } from "../components/ui";
import type { NotificationItem, NotificationType } from "../services";
import { formatRelativeTimestamp } from "../services";

interface DashboardNotificationsProps {
  onNavigate: (view: string) => void;
}

const PAGE_SIZE = 12;

const typeStyles: Record<NotificationType, { icon: React.ReactNode; tone: string; dot: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    tone: "text-positive bg-positive/10 border-positive/20",
    dot: "bg-positive"
  },
  info: {
    icon: <Info size={18} />,
    tone: "text-accent bg-accent/10 border-accent/20",
    dot: "bg-accent"
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    tone: "text-warning bg-warning-soft border-warning-line",
    dot: "bg-warning"
  },
  error: {
    icon: <XCircle size={18} />,
    tone: "text-negative bg-negative/10 border-negative/20",
    dot: "bg-negative"
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

        <Button
          variant="secondary"
          icon={CheckCheck}
          onClick={markAllNotificationsRead}
          disabled={!unreadNotificationsCount}
        >
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Account activity, reviews, bulletins and trade updates will appear here."
        />
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
                      <p className="mt-1.5 text-sm leading-6 text-muted">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted">{formatRelativeTimestamp(notification.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    {notification.action && (
                      <Button
                        size="sm"
                        variant="secondary"
                        iconRight={ArrowRight}
                        onClick={() => handleAction(notification)}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markNotificationRead(notification.id)}
                        title="Mark as read"
                        aria-label={`Mark "${notification.title}" as read`}
                      >
                        <CheckCircle2 size={15} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete notification"
                      aria-label={`Delete "${notification.title}"`}
                      className="hover:text-negative"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleCount < notifications.length && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
