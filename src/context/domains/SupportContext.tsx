import React, { createContext, useContext, useEffect } from "react";
import { useSupportTickets, type AdminSupportTicket } from "../../hooks/data/useSupportTickets";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useSiteSettings } from "./SiteSettingsContext";

interface SupportContextType {
  supportTickets: AdminSupportTicket[];
  createTicket: (
    subject: string,
    category: "deposit" | "withdrawal" | "trading" | "general",
    initialMsg: string,
    priority?: "low" | "medium" | "high"
  ) => void;
  replyToTicket: (ticketId: string, text: string) => void;
  adminReplyToTicket: (ticketId: string, text: string) => void;
  adminCloseTicket: (ticketId: string) => void;
  adminSetTicketPriority: (ticketId: string, priority: "low" | "medium" | "high") => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

/** Support tickets — the user's own thread list plus the admin help-desk queue. */
export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, currentUserIsAdmin } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { dispatchTransactionalEmail } = useNotifications();
  const { appSettings } = useSiteSettings();

  const {
    myTickets: supabaseTickets,
    allTickets: supportTickets,
    createTicket: createTicketInDb,
    replyToTicket: replyToTicketInDb,
    replyToTicketAsSupport,
    closeTicket: closeTicketInDb,
    setTicketPriority: setTicketPriorityInDb
  } = useSupportTickets(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  // Keep support tickets in sync with their Supabase source. Depends on
  // user.isLoggedIn as well as the hook data — see the note on the other
  // overlay effects: the data can resolve before the profile loader flips
  // isLoggedIn, and without that dependency the early fire is a permanent
  // no-op.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn ? { ...prev, tickets: supabaseTickets } : prev);
  }, [supabaseTickets, user.isLoggedIn]);

  const createTicket = async (
    subject: string,
    category: "deposit" | "withdrawal" | "trading" | "general",
    initialMsg: string,
    priority: "low" | "medium" | "high" = "medium"
  ) => {
    try {
      const ticketId = await createTicketInDb(subject, category, initialMsg, priority);
      handleLog("Support Ticket Created", `Submitted ticket regarding topic: ${subject}`, user.email || "guest@gmail.com", "success");
      dispatchTransactionalEmail(user.email, "SUPPORT_TICKET_CREATED", `ticket:created:${ticketId}`, { name: user.name, subject, category, reference: ticketId, status: "open" });

      // Auto simulated response
      setTimeout(() => {
        replyToTicketAsSupport(ticketId, `Dear Moneta Prime Member, thank you for writing. Dynamic agent node assigned. We are actively auditing your ${category} logs. Please stand by.`)
          .catch(error => console.error("Failed to send ticket auto-response:", error));
      }, 4000);
    } catch (error) {
      console.error("Failed to create support ticket:", error);
    }
  };

  const replyToTicket = async (ticketId: string, text: string) => {
    try {
      await replyToTicketInDb(ticketId, text);
      // Notify the support desk (the single configured support inbox) that the
      // user posted a reply — the "other direction" of ticket correspondence.
      const supportInbox = appSettings.supportEmail;
      if (supportInbox) {
        const ticket = user.tickets.find(t => t.id === ticketId);
        dispatchTransactionalEmail(supportInbox, "SUPPORT_TICKET_REPLY", `ticket:userreply:${ticketId}:${Date.now()}`, { name: "Support Team", subject: ticket?.subject || `Ticket ${ticketId}`, reference: ticketId, replyPreview: `${user.email || "A user"} replied: ${text.slice(0, 120)}` });
      }
    } catch (error) {
      console.error("Failed to reply to support ticket:", error);
    }
  };

  const adminReplyToTicket = async (ticketId: string, replyText: string) => {
    try {
      await replyToTicketAsSupport(ticketId, replyText);
      handleLog("Ticket Replied", `Dispatched help-desk payload to Ticket ID: ${ticketId}`, user.email || "admin", "success");
      const ticket = supportTickets.find(t => t.id === ticketId);
      if (ticket?.userEmail) {
        dispatchTransactionalEmail(ticket.userEmail, "SUPPORT_TICKET_REPLY", `ticket:reply:${ticketId}:${Date.now()}`, { name: ticket.userEmail.split("@")[0], subject: ticket.subject, reference: ticketId, replyPreview: replyText.slice(0, 140) });
      }
    } catch (e) {
      console.error("Error replying to ticket:", e);
    }
  };

  const adminCloseTicket = async (ticketId: string) => {
    try {
      await closeTicketInDb(ticketId);
      handleLog("Ticket Finalised", `Flagged Ticket ID: ${ticketId} resolved.`, user.email || "admin", "success");
    } catch (e) {
      console.error("Error closing ticket:", e);
    }
  };

  const adminSetTicketPriority = async (ticketId: string, rate: "low" | "medium" | "high") => {
    try {
      await setTicketPriorityInDb(ticketId, rate);
    } catch (e) {
      console.error("Error setting ticket priority:", e);
    }
  };

  return (
    <SupportContext.Provider value={{
      supportTickets,
      createTicket,
      replyToTicket,
      adminReplyToTicket,
      adminCloseTicket,
      adminSetTicketPriority
    }}>
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error("useSupport must be used inside a SupportProvider");
  }
  return context;
};
