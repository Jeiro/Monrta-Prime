import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LifeBuoy, MessageSquare, Send } from "lucide-react";

// Standalone Help Center / Support page. Previously this lived inside the
// Wallet page as a sub-tab (?tab=support); it is now its own route
// (/dashboard/support) with its own nav entry. The ticket create/list/reply
// logic is unchanged — it still uses createTicket / replyToTicket from context.
export const DashboardSupport: React.FC = () => {
  const { user, createTicket, replyToTicket } = useApp();

  const [tktSubject, setTktSubject] = useState("");
  const [tktCategory, setTktCategory] = useState<"deposit" | "withdrawal" | "trading" | "general">("general");
  const [tktInitialMsg, setTktInitialMsg] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(user.tickets[0]?.id || null);
  const [tktReplyTxt, setTktReplyTxt] = useState("");

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !tktInitialMsg.trim()) return;

    createTicket(tktSubject, tktCategory, tktInitialMsg);

    // Clear forms
    setTktSubject("");
    setTktInitialMsg("");
    setTktCategory("general");
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !tktReplyTxt.trim()) return;

    replyToTicket(selectedTicketId, tktReplyTxt);
    setTktReplyTxt("");
  };

  const activeTicketObj = user.tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Page Header */}
      <div className="border-b border-line/50 pb-6">
        <div className="flex items-center gap-2 text-ink">
          <LifeBuoy size={24} className="text-ink shrink-0" />
          <h1 className="text-2xl font-bold font-heading">Help Center</h1>
        </div>
        <p className="text-xs text-muted mt-1 font-sans">
          Open a support ticket, track its status, and chat with our team in one place.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Left Column: Create new ticket (col-span-5) */}
          <form onSubmit={handleCreateTicketSubmit} className="lg:col-span-5 lg:border-r border-line/40 lg:pr-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-accent border-b border-line/50 pb-2">
              New Support Ticket
            </h3>

            <div className="space-y-1">
              <label className="text-2xs text-muted uppercase font-mono">Subject</label>
              <input
                type="text"
                required
                value={tktSubject}
                onChange={(e) => setTktSubject(e.target.value)}
                placeholder="e.g., Deposit delay"
                className="w-full bg-ground border border-line rounded-lg py-2 px-3 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-2xs text-muted uppercase font-mono">Category</label>
              <select
                value={tktCategory}
                onChange={(e) => setTktCategory(e.target.value as any)}
                className="w-full bg-ground border border-line rounded-lg py-2 px-3 text-xs text-ink focus:border-accent focus:outline-none"
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="trading">Trading</option>
                <option value="general">Account</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-2xs text-muted uppercase font-mono font-semibold">Message</label>
              <textarea
                required
                rows={4}
                value={tktInitialMsg}
                onChange={(e) => setTktInitialMsg(e.target.value)}
                placeholder="Detail your request..."
                className="w-full bg-ground border border-line rounded-lg py-2 px-3 text-xs text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-accent text-ground font-bold text-xs uppercase rounded-lg shadow-md shadow-accent/15 hover:opacity-95 transition-all text-center cursor-pointer"
            >
              Submit
            </button>
          </form>

          {/* Right Column: Active Interactive chat logs (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-[360px]">

            {/* Ticket selector header */}
            <div className="flex bg-ground p-1.5 border border-line/70 rounded-lg justify-start gap-2 overflow-x-auto scrollbar-none">
              {user.tickets.length === 0 ? (
                <span className="text-2xs text-muted p-1 font-sans">No active support tickets.</span>
              ) : (
                user.tickets.map((tkt) => (
                  <button
                    key={tkt.id}
                    onClick={() => setSelectedTicketId(tkt.id)}
                    className={`px-3 py-1.5 rounded text-2xs font-semibold tracking-normal shrink-0 transition-all ${
                      selectedTicketId === tkt.id
                        ? "bg-surface text-accent border border-line"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {tkt.subject.slice(0, 16)}...
                  </button>
                ))
              )}
            </div>

            {/* Chat log messages */}
            <div className="flex-1 overflow-y-auto my-4 p-3 bg-panel/50 border border-line/40 rounded-xl space-y-4">
              {activeTicketObj ? (
                activeTicketObj.messages.map((m, idx) => {
                  const isSupport = m.sender === "support";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isSupport ? "items-start" : "items-end"}`}
                    >
                      <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-normal ${
                        isSupport
                          ? "bg-ground/85 border border-line text-ink rounded-tl-none"
                          : "bg-accent text-ground font-medium rounded-tr-none"
                      }`}>
                        <p>{m.text}</p>
                        <span className="block text-2xs text-right mt-1 opacity-70">
                          {m.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted space-y-2">
                  <MessageSquare size={24} className="text-line animate-bounce" />
                  <p className="text-xs">Select an active ticket above, or submit a new one on the left.</p>
                </div>
              )}
            </div>

            {/* Chat Reply form */}
            {activeTicketObj && (
              <form onSubmit={handleReplySubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={tktReplyTxt}
                  onChange={(e) => setTktReplyTxt(e.target.value)}
                  placeholder="Type supplementary explanations..."
                  className="flex-1 bg-ground border border-line focus:border-accent rounded-xl px-4 py-2 text-xs text-ink focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-accent text-ground font-bold transition-all cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
