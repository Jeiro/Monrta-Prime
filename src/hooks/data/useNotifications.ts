import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationItem } from "../../services";
import { normalizeNotification } from "../../services";

function rowToNotification(row: any): NotificationItem {
  return normalizeNotification({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    timestamp: row.timestamp,
    read: row.read,
    recipientEmail: row.recipient_email,
    audience: row.audience || undefined,
    eventKey: row.event_key || undefined,
    action: row.action || undefined
  }, row.id);
}

function notificationToRow(notification: NotificationItem): Record<string, any> {
  return {
    id: notification.id,
    recipient_email: notification.recipientEmail,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    timestamp: notification.timestamp,
    read: notification.read,
    audience: notification.audience || null,
    event_key: notification.eventKey || null,
    action: notification.action || null
  };
}

/**
 * Notifications — backed entirely by Supabase's `notifications` table.
 * No Firebase. Unlike every other feature hook, this one owns no React
 * state of its own: `AppContext.tsx` already owns the `notifications`
 * array directly (with optimistic local mutations for mark-read/delete
 * layered on top), so wrapping it in a second, separately-fetched state
 * here would create two sources of truth that could clobber each other.
 * This hook is just the thin Supabase-backed replacement for what
 * `notificationsService.ts`'s Firestore functions used to do — fetch,
 * save, mark-read, delete — leaving AppContext's existing business
 * logic untouched.
 *
 * No live push: unlike the old Firestore `onSnapshot` subscription, this
 * is fetch-on-mount only, same as every other migrated feature. A
 * notification for a different user's session shows up on their next
 * natural refetch, not instantly.
 */
export function useNotifications(supabase: SupabaseClient) {
  const fetchNotifications = async (recipientEmail: string): Promise<NotificationItem[]> => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_email", recipientEmail)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Failed to load notifications:", error);
      return [];
    }
    return (data || []).map(rowToNotification);
  };

  const saveNotificationToDb = async (notification: NotificationItem) => {
    const { error } = await supabase.from("notifications").upsert(notificationToRow(notification), { onConflict: "id" });
    if (error) throw error;
  };

  const markReadInDb = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    if (error) throw error;
  };

  const markManyReadInDb = async (notificationIds: string[]) => {
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", notificationIds);
    if (error) throw error;
  };

  const deleteNotificationInDb = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
    if (error) throw error;
  };

  return { fetchNotifications, saveNotificationToDb, markReadInDb, markManyReadInDb, deleteNotificationInDb };
}
