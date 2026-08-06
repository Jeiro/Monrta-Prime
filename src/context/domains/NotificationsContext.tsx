import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildNotification,
  formatRelativeTimestamp,
  isAdminEmail,
  normalizeNotification,
  safeParse,
  sortNotifications,
  USE_MOCK_DATA,
  type BuildNotificationOptions,
  type NotificationItem
} from "../../services";
import { useNotifications as useNotificationsData } from "../../hooks/data/useNotifications";
import { useEmailNotifications } from "../../hooks/useEmailNotifications";
import type { TransactionalEmailEvent } from "../../lib/emailClient";
import { useSession } from "./SessionContext";
import { useSiteSettings } from "./SiteSettingsContext";
import { useAdminUsersData } from "./AdminUsersContext";

const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "henrikaram1@gmail.com";

/**
 * Dedup ledger for transactional email, keyed by event id.
 *
 * SCOPE CAVEAT: localStorage is per-browser, so this only prevents a repeat
 * send from the same device. Two admins approving the same deposit from
 * different sessions can each send the user one copy — the underlying RPCs
 * are idempotent for the MONEY (they return early unless status = 'pending')
 * but they return silently, so the second caller's code path continues and
 * dispatches its own email. Making this airtight means moving the ledger
 * server-side; see the notes in the phase report before changing it here.
 */
const SENT_EMAIL_EVENTS_KEY = "moneta_prime_sent_email_events";

const localStorageGet = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
};

const localStorageSet = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (text: string, options?: BuildNotificationOptions) => void;
  clearNotifications: () => void;
  /** Fan a notification out to every admin, plus the fallback admin inbox. */
  notifyAdmins: (text: string, options?: BuildNotificationOptions) => void;
  /** Deduped transactional email send. Every domain's money comms go through this. */
  dispatchTransactionalEmail: (
    to: string | null | undefined,
    eventType: TransactionalEmailEvent,
    eventId: string,
    metadata?: Record<string, any>
  ) => void;
  sendWelcomeNotification: (recipientEmail: string, recipientName?: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/**
 * In-app notifications plus the transactional-email dispatcher.
 *
 * Email lives here rather than in its own context because the two are always
 * used together: every domain that raises a notification about money also
 * sends the matching email, with the same event-id dedup key.
 *
 * This provider sits below Session (needs the signed-in user), SiteSettings
 * (email sender identity) and AdminUsersData (notifyAdmins' recipient list),
 * and above every domain that raises notifications — i.e. all of them.
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, authReady, currentSupabaseUserId } = useSession();
  const { appSettings } = useSiteSettings();
  const { usersDirectory } = useAdminUsersData();
  const { fetchNotifications, saveNotificationToDb, markReadInDb, markManyReadInDb, deleteNotificationInDb } =
    useNotificationsData(supabase);
  const { sendTransactionalEmail } = useEmailNotifications();

  // Renamed from the pre-rebrand "orbitrio_sent_email_events". Deliberately
  // no migration: this is a localStorage-only dedup ledger, so the cost of
  // resetting it is at most one repeat email per already-delivered event on
  // a browser that had old state, and only if that exact event fires again.
  const sentEmailEventIdsRef = useRef<Set<string>>(new Set(localStorageGet<string[]>(SENT_EMAIL_EVENTS_KEY, [])));
  // Events currently being sent — prevents a concurrent double-send without
  // permanently reserving the id (which would block retries after a failure).
  const inFlightEmailEventsRef = useRef<Set<string>>(new Set());

  const emailSettingsMetadata = () => ({
    companyName: appSettings.companyName,
    supportEmail: appSettings.supportEmail,
    senderName: appSettings.senderName,
    replyToEmail: appSettings.replyToEmail || appSettings.supportEmail
  });

  const markEmailEventSent = (eventId: string) => {
    sentEmailEventIdsRef.current.add(eventId);
    localStorageSet(SENT_EMAIL_EVENTS_KEY, Array.from(sentEmailEventIdsRef.current));
  };

  const dispatchTransactionalEmail = (
    to: string | null | undefined,
    eventType: TransactionalEmailEvent,
    eventId: string,
    metadata: Record<string, any> = {}
  ) => {
    // Never silently drop a transactional email (esp. money comms) for a
    // missing recipient — surface it so it can be diagnosed, not swallowed.
    if (!to) {
      console.error(`Transactional email ${eventType} skipped: no recipient email (eventId=${eventId}).`);
      return;
    }
    // Persistent dedup (already delivered) OR an in-flight send for the same
    // event — don't double-send. The in-flight guard prevents a rapid double
    // dispatch before the first send resolves.
    if (sentEmailEventIdsRef.current.has(eventId) || inFlightEmailEventsRef.current.has(eventId)) return;

    inFlightEmailEventsRef.current.add(eventId);
    void sendTransactionalEmail(to, eventType, {
      ...emailSettingsMetadata(),
      ...metadata,
      eventId,
      email: to
    }).then(result => {
      if (result?.success === false) {
        // Do NOT mark as sent — a failed send must remain retryable. (The old
        // code reserved the id before sending, so any failure permanently
        // blocked re-sends of that event — e.g. the withdrawal-rejection email.)
        console.error(`Transactional email ${eventType} failed:`, result.error || result.message);
        return;
      }
      markEmailEventSent(eventId);
    }).catch(error => {
      console.error(`Transactional email ${eventType} failed:`, error);
    }).finally(() => {
      inFlightEmailEventsRef.current.delete(eventId);
    });
  };

  // Welcome email, fired once from AuthPage after a successful Clerk signup is
  // confirmed & active. Uses the same persistent event-id dedup as every other
  // send (`auth:welcome:<email>`), so it can never double-send across logins.
  const sendWelcomeNotification = (recipientEmail: string, recipientName?: string) => {
    dispatchTransactionalEmail(recipientEmail, "WELCOME", `auth:welcome:${recipientEmail.toLowerCase()}`, {
      name: recipientName || recipientEmail.split("@")[0],
      email: recipientEmail
    });
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("orbitrio_notifications");
    const fallback = [
      buildNotification("Welcome to Moneta Prime Crypto Hub! Verify security rules inside setting pane.", {
        id: "not-1",
        title: "Welcome to Moneta Prime",
        type: "success"
      })
    ];
    const parsed = saved ? safeParse<Array<Partial<NotificationItem> & { id?: string }>>(saved, fallback) : fallback;
    return sortNotifications(parsed.map(item => normalizeNotification(item, item.id)));
  });
  const unreadNotificationsCount = useMemo(() => notifications.filter(item => !item.read).length, [notifications]);

  useEffect(() => {
    localStorage.setItem("orbitrio_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (!authReady || !user.isLoggedIn || !user.email) {
      setNotifications([]);
      return;
    }

    if (USE_MOCK_DATA) {
      setNotifications(prev => sortNotifications(prev.map(item => ({
        ...normalizeNotification(item, item.id),
        time: formatRelativeTimestamp(item.timestamp)
      }))));
      return;
    }

    let cancelled = false;
    fetchNotifications(user.email).then(items => {
      if (!cancelled) setNotifications(items);
    }).catch(error => {
      console.error("Notification sync error:", error);
    });
    return () => { cancelled = true; };
  }, [authReady, user.isLoggedIn, user.email]);

  const syncNotificationLocally = (notification: NotificationItem) => {
    setNotifications(prev => {
      if (notification.eventKey && prev.some(item => item.eventKey === notification.eventKey && item.recipientEmail === notification.recipientEmail)) {
        return prev;
      }
      if (prev.some(item => item.id === notification.id)) return prev;
      return sortNotifications([notification, ...prev]);
    });
  };

  const shouldShowNotificationLocally = (notification: NotificationItem) => {
    if (!notification.recipientEmail) return true;
    return user.email?.toLowerCase() === notification.recipientEmail.toLowerCase();
  };

  const addNotification = (text: string, options: BuildNotificationOptions = {}) => {
    const recipientEmail = options.recipientEmail || user.email || undefined;
    const notification = buildNotification(text, {
      ...options,
      recipientEmail,
      audience: options.audience || (user.role === "admin" ? "admin" : "user")
    });

    if (shouldShowNotificationLocally(notification)) {
      syncNotificationLocally(notification);
    }

    // Only persist once Clerk has loaded (currentSupabaseUserId set) — otherwise
    // the Supabase client can't attach a token yet and the write 401s (bug #26).
    // The local/optimistic notification above still shows regardless.
    if (!USE_MOCK_DATA && notification.recipientEmail && currentSupabaseUserId) {
      saveNotificationToDb(notification).catch(error => {
        console.error("Error saving notification:", error);
      });
    }
  };

  const notifyAdmins = (text: string, options: BuildNotificationOptions = {}) => {
    const adminEmails = Array.from(new Set([
      ...usersDirectory
        .filter(profile => profile.role === "admin" || isAdminEmail(profile.email))
        .map(profile => profile.email),
      user.role === "admin" && user.email ? user.email : DEFAULT_ADMIN_NOTIFICATION_EMAIL
    ].filter(Boolean) as string[]));

    adminEmails.forEach(adminEmail => {
      addNotification(text, {
        ...options,
        recipientEmail: adminEmail,
        audience: "admin",
        eventKey: options.eventKey ? `admin:${adminEmail}:${options.eventKey}` : undefined
      });
    });
  };

  const markNotificationRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, read: true } : item));
    if (!USE_MOCK_DATA) {
      await markReadInDb(notificationId);
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(item => !item.read).map(item => item.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    if (!USE_MOCK_DATA) {
      await markManyReadInDb(unreadIds);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(item => item.id !== notificationId));
    if (!USE_MOCK_DATA) {
      await deleteNotificationInDb(notificationId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadNotificationsCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      addNotification,
      clearNotifications,
      notifyAdmins,
      dispatchTransactionalEmail,
      sendWelcomeNotification
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used inside a NotificationsProvider");
  }
  return context;
};
