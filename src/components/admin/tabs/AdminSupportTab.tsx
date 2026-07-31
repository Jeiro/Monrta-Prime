import React, { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { motion } from "motion/react";
import { MessageSquare, Send, X as XIcon, Search, AlertTriangle } from "lucide-react";

export const AdminSupportTab: React.FC = () => {
  const { supportTickets, adminReplyToTicket, adminCloseTicket, adminSetTicketPriority } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allTickets = supportTickets;

  const sorted = [...allTickets].sort((a, b) => {
    const statusOrder: Record<string, number> = { open: 0, pending: 1, resolved: 2 };
    return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
  });

  const filtered = sorted.filter(t =>
    t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCount = allTickets.filter(t => t.status === "open").length;

  const statusColors: Record<string, string> = {
    open: "text-negative bg-negative/10 border-negative/30",
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    resolved: "text-positive bg-positive/10 border-positive/30"
  };

  const priorityColors: Record<string, string> = {
    high: "text-negative bg-negative/10 border-negative/30",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    low: "text-positive bg-positive/10 border-positive/30"
  };

  const handleReply = (ticketId: string) => {
    const text = replyTexts[ticketId];
    if (!text?.trim()) return;
    adminReplyToTicket(ticketId, text.trim());
    setReplyTexts(prev => ({ ...prev, [ticketId]: "" }));
    setFeedback("Reply sent successfully.");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <MessageSquare size={20} className="text-accent" /> Ticket Helpdesk
            </h1>
            <p className="text-xs text-muted mt-1">Manage and respond to user support tickets.</p>
          </div>
          {openCount > 0 && (
            <span className="flex items-center gap-2 text-2xs font-bold text-negative bg-negative/10 border border-negative/30 px-3 py-1.5 rounded-full animate-pulse">
              <AlertTriangle size={12} /> {openCount} Open Tickets
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold">
          {feedback}
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filtered.map(ticket => {
          const isExpanded = expandedTicket === ticket.id;
          return (
            <div key={ticket.id} className={`bg-surface border rounded-2xl overflow-hidden ${ticket.status === "open" ? "border-negative/30" : "border-line"}`}>
              <button onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-line/20 transition-colors cursor-pointer text-left gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-deep flex items-center justify-center text-ink text-2xs font-black">
                    {ticket.userName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{ticket.subject}</p>
                    <p className="text-2xs text-muted">{ticket.userName} • {ticket.userEmail} • {ticket.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${priorityColors[ticket.priority]}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-line p-4 space-y-4 bg-ground/50">
                  {/* Messages */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {ticket.messages.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex ${msg.sender === "support" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-xs ${msg.sender === "support" ? "bg-accent/20 text-accent rounded-br-none" : "bg-surface border border-line text-ink rounded-bl-none"}`}>
                          <p>{msg.text}</p>
                          <p className="text-2xs text-muted mt-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex gap-2">
                      <input placeholder="Type a reply..." value={replyTexts[ticket.id] || ""} onChange={e => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") handleReply(ticket.id); }}
                        className="flex-1 px-4 py-2 bg-surface border border-line rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
                      <button onClick={() => handleReply(ticket.id)}
                        className="px-4 py-2 bg-accent text-ground font-bold text-xs rounded-xl hover:opacity-90 cursor-pointer">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-line/50">
                    {(["low", "medium", "high"] as const).map(p => (
                      <button key={p} onClick={() => adminSetTicketPriority(ticket.id, p)}
                        className={`px-3 py-1 text-2xs font-bold rounded-lg border cursor-pointer transition-colors ${ticket.priority === p ? priorityColors[p] : "text-muted border-line hover:border-accent"}`}>
                        {p.toUpperCase()}
                      </button>
                    ))}
                    <button onClick={() => { adminCloseTicket(ticket.id); setFeedback("Ticket closed."); setTimeout(() => setFeedback(null), 3000); }}
                      className="px-3 py-1 bg-positive/10 border border-positive/30 text-positive text-2xs font-bold rounded-lg hover:bg-positive/20 cursor-pointer">
                      Mark Resolved
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No support tickets found.</div>
        )}
      </div>
    </motion.div>
  );
};
