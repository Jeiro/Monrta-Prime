import React from "react";
import { AlertTriangle, Check, Megaphone, Pin } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../../context/AppContext";
import type { AnnouncementPriority } from "../../types";
import { formatDate } from "../../lib/format";

const priorityStyle: Record<AnnouncementPriority, { badge: string; border: string; icon: React.ReactNode }> = {
  Normal: {
    badge: "bg-surface/10 text-muted border-line/30",
    border: "border-line",
    icon: <Megaphone size={15} className="text-accent" />
  },
  Important: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    border: "border-amber-500/30",
    icon: <AlertTriangle size={15} className="text-amber-300" />
  },
  Critical: {
    badge: "bg-negative/10 text-negative border-negative/30",
    border: "border-negative/40",
    icon: <AlertTriangle size={15} className="text-negative" />
  }
};

export const UserAnnouncements: React.FC = () => {
  const { user, userAnnouncements, markAnnouncementRead } = useApp();

  if (userAnnouncements.length === 0) return null;

  const readIds = user.readAnnouncementIds || [];

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone size={17} className="text-accent" />
          <h2 className="text-sm font-bold text-ink font-heading">Announcements</h2>
        </div>
        <span className="text-2xs text-muted font-bold uppercase tracking-wider">
          {userAnnouncements.filter(item => !readIds.includes(item.id)).length} unread
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {userAnnouncements.map(announcement => {
          const priority = announcement.priority || "Normal";
          const style = priorityStyle[priority];
          const unread = !readIds.includes(announcement.id);

          return (
            <article key={announcement.id} className={`rounded-xl border ${style.border} ${unread ? "bg-accent/10 shadow shadow-accent/5" : "bg-surface/80"} p-4 transition-colors`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.pinned && <Pin size={12} className="text-accent" />}
                    {style.icon}
                    <h3 className="text-sm font-bold text-ink break-words">{announcement.title}</h3>
                    {unread && <span className="w-2 h-2 rounded-full bg-accent" title="Unread" />}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted break-words">{announcement.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-muted">
                    <span className={`px-2 py-0.5 rounded-full border font-bold ${style.badge}`}>{priority}</span>
                    <span>{formatDate(announcement.publishDate || announcement.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => markAnnouncementRead(announcement.id)}
                  disabled={!unread}
                  className={`shrink-0 p-2 rounded-lg border transition-colors ${unread ? "bg-ground border-line text-accent hover:bg-accent hover:text-ground" : "bg-positive/10 border-positive/20 text-positive cursor-default"}`}
                  title={unread ? "Mark as read" : "Read"}
                >
                  <Check size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
};

