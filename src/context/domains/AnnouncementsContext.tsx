import React, { createContext, useContext } from "react";
import type { Announcement } from "../../types";
import { isAdminEmail, isAnnouncementRead, USE_MOCK_DATA } from "../../services";
import { useAnnouncements as useAnnouncementsData } from "../../hooks/data/useAnnouncements";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useAdminUsersData } from "./AdminUsersContext";

interface AnnouncementsContextType {
  adminAnnouncements: Announcement[];
  userAnnouncements: Announcement[];
  adminCreateAnnouncement: (
    announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>
  ) => Promise<void>;
  adminUpdateAnnouncement: (announcement: Announcement) => Promise<void>;
  adminDeleteAnnouncement: (announcementId: string) => Promise<void>;
  markAnnouncementRead: (announcementId: string) => Promise<void>;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

/**
 * Platform bulletins. Publishing one fans a per-user notification out over the
 * users directory, which is why this reads AdminUsersData.
 */
export const AnnouncementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, currentUserIsLoggedIn, currentUserIsAdmin } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification } = useNotifications();
  const { usersDirectory } = useAdminUsersData();

  const {
    adminAnnouncements,
    userAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useAnnouncementsData(supabase, authReady, currentUserIsLoggedIn, currentUserIsAdmin);

  const adminCreateAnnouncement = async (announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>) => {
    const fresh = await createAnnouncement(announcement);
    handleLog("Announcement Published", `Added announcement: ${fresh.title}`, user.email || "admin", "success");
    addNotification(`Global announcement published: "${fresh.title}".`, { title: "Announcement published", type: "success", eventKey: `admin:announcement:${fresh.id}` });
    usersDirectory.filter(target => target.role !== "admin" && !isAdminEmail(target.email)).forEach(target => {
      addNotification(fresh.content, { title: fresh.title, type: fresh.priority === "Critical" ? "warning" : "info", recipientEmail: target.email, eventKey: `announcement:${fresh.id}:${target.email}`, action: { label: "View dashboard", view: "dashboard" } });
    });
  };

  const adminUpdateAnnouncement = async (announcement: Announcement) => {
    const updated = await updateAnnouncement(announcement);
    handleLog("Announcement Updated", `Updated announcement: ${updated.title}`, user.email || "admin", "warning");
  };

  const adminDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    handleLog("Announcement Deleted", `Removed announcement ID: ${id}`, user.email || "admin", "warning");
  };

  const markAnnouncementRead = async (announcementId: string) => {
    if (!user.email || isAnnouncementRead(announcementId, user.readAnnouncementIds)) return;

    const readAnnouncementIds = [...(user.readAnnouncementIds || []), announcementId];
    setUser(prev => ({ ...prev, readAnnouncementIds }));

    if (!USE_MOCK_DATA) {
      if (currentSupabaseUserId) {
        const { error } = await supabase
          .from("user_read_announcements")
          .upsert({ user_id: currentSupabaseUserId, announcement_id: announcementId }, { onConflict: "user_id,announcement_id" });
        if (error) console.error("Failed to sync read-announcement to Supabase:", error);
      }
    }
  };

  return (
    <AnnouncementsContext.Provider value={{
      adminAnnouncements,
      userAnnouncements,
      adminCreateAnnouncement,
      adminUpdateAnnouncement,
      adminDeleteAnnouncement,
      markAnnouncementRead
    }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error("useAnnouncements must be used inside an AnnouncementsProvider");
  }
  return context;
};
