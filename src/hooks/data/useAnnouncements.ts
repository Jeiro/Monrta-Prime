import { useState, useEffect, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Announcement } from "../../types";
import {
  USE_MOCK_DATA,
  normalizeAnnouncement,
  sortAnnouncementsForAdmin,
  filterActiveAnnouncements
} from "../../services";

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "BTC Trading Competition Starts Tomorrow",
    content: "Trade BTC spot or perpetuals to win up to $50,000 USDT in master rewards. Rankings update in real-time.",
    date: "2026-06-19",
    pinned: true
  },
  {
    id: "ann-2",
    title: "Cold Wallet Maintenance Completed",
    content: "System cold nodes security inspection executed successfully. Deposit of BTC, ETH, USDT is processed seamlessly now.",
    date: "2026-06-18",
    pinned: false
  }
];

function announcementRowToItem(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date || (row.created_at ? row.created_at.slice(0, 10) : ""),
    pinned: row.pinned,
    enabled: row.enabled,
    priority: row.priority,
    publishDate: row.publish_date ? String(row.publish_date).slice(0, 10) : "",
    expiryDate: row.expiry_date ? String(row.expiry_date).slice(0, 10) : "",
    scheduledDate: row.scheduled_date ? String(row.scheduled_date).slice(0, 10) : undefined,
    updatedAt: row.updated_at
  };
}

function announcementToRow(a: Announcement): Record<string, any> {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    date: a.date,
    pinned: a.pinned,
    enabled: a.enabled ?? true,
    priority: a.priority || "Normal",
    publish_date: a.publishDate || null,
    expiry_date: a.expiryDate || null,
    scheduled_date: a.scheduledDate || null,
    updated_at: a.updatedAt || new Date().toISOString()
  };
}

/**
 * Admin-authored announcements. Backed entirely by Supabase's
 * `announcements` table. No Firebase. Persistence + fetch only — the
 * caller (AnnouncementsContext) wraps these with notification/audit-log side
 * effects, since those touch broader app state this hook doesn't own.
 */
export function useAnnouncements(
  supabase: SupabaseClient,
  authReady: boolean,
  isLoggedIn: boolean,
  isAdmin: boolean
) {
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>(() =>
    sortAnnouncementsForAdmin(INITIAL_ANNOUNCEMENTS.map(item => normalizeAnnouncement(item, item.id)))
  );

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!authReady || !isLoggedIn) {
      setAdminAnnouncements([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("announcements").select("*");

      if (cancelled) return;

      if (error) {
        console.error("Failed to load announcements:", error);
        return;
      }

      if (!data || data.length === 0) {
        if (isAdmin) {
          const seeded = INITIAL_ANNOUNCEMENTS.map(item => normalizeAnnouncement(item, item.id));
          const { error: seedError } = await supabase
            .from("announcements")
            .insert(seeded.map(announcementToRow));
          if (seedError) console.error("Error seeding announcements:", seedError);
          setAdminAnnouncements(sortAnnouncementsForAdmin(seeded));
        }
      } else {
        setAdminAnnouncements(sortAnnouncementsForAdmin(data.map(announcementRowToItem)));
      }
    })();

    return () => { cancelled = true; };
  }, [authReady, isLoggedIn, isAdmin]);

  const userAnnouncements = useMemo(() => filterActiveAnnouncements(adminAnnouncements), [adminAnnouncements]);

  const createAnnouncement = async (
    announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>
  ) => {
    const fresh = normalizeAnnouncement(announcement);
    setAdminAnnouncements(prev => sortAnnouncementsForAdmin([fresh, ...prev]));

    if (!USE_MOCK_DATA) {
      const { error } = await supabase.from("announcements").insert(announcementToRow(fresh));
      if (error) throw error;
    }
    return fresh;
  };

  const updateAnnouncement = async (announcement: Announcement) => {
    const updated = normalizeAnnouncement(announcement, announcement.id);
    setAdminAnnouncements(prev => sortAnnouncementsForAdmin(prev.map(item => item.id === updated.id ? updated : item)));

    if (!USE_MOCK_DATA) {
      const { error } = await supabase
        .from("announcements")
        .update(announcementToRow(updated))
        .eq("id", updated.id);
      if (error) throw error;
    }
    return updated;
  };

  const deleteAnnouncement = async (id: string) => {
    setAdminAnnouncements(prev => prev.filter(a => a.id !== id));

    if (!USE_MOCK_DATA) {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    }
  };

  return { adminAnnouncements, userAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
}