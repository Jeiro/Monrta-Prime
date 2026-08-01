import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LifeBuoy, MessageSquare, Send } from "lucide-react";
import { Button, EmptyState, Input, SectionCard, Select, Tabs, Textarea } from "../components/ui";

// Standalone Help Center / Support page. Previously this lived inside the
// Wallet page as a sub-tab (?tab=support); it is now its own route
// (/dashboard/support) with its own nav entry. The ticket create/list/reply
// logic is unchanged — it still uses createTicket / replyToTicket from context.
export const DashboardSupport: React.FC = () => {
  const { user, createTicket, replyToTicket } = useApp();

  const [tktSubject, setTktSubject] = useState("");
  const [tktCategory, setTktCategory] = useState<"deposit" | "withdrawal" | "trading" | "general">(
    "general"
  );
  const [tktInitialMsg, setTktInitialMsg] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    user.tickets[0]?.id || null
  );
  const [tktReplyTxt, setTktReplyTxt] = useState("");

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !tktInitialMsg.trim()) return;

    createTicket(tktSubject, tktCategory, tktInitialMsg);

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

  const activeTicketObj = user.tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      <header className="border-b border-line pb-5">
        <div className="flex items-center gap-2.5">
          <LifeBuoy size={20} className="shrink-0 text-faint" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Help centre</h1>
        </div>
        <p className="mt-1 text-xs text-muted">
          Open a ticket, track its status, and talk to our team in one place.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <SectionCard className="lg:col-span-5" title="New ticket">
          <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
            <Input
              label="Subject"
              required
              value={tktSubject}
              onChange={(e) => setTktSubject(e.target.value)}
              placeholder="e.g. Deposit delay"
            />

            <Select
              label="Category"
              value={tktCategory}
              onChange={(e) => setTktCategory(e.target.value as typeof tktCategory)}
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="trading">Trading</option>
              <option value="general">Account</option>
            </Select>

            <Textarea
              label="Message"
              required
              rows={5}
              value={tktInitialMsg}
              onChange={(e) => setTktInitialMsg(e.target.value)}
              placeholder="Describe what happened, and include any transaction ID."
            />

            <Button type="submit" block>
              Submit ticket
            </Button>
          </form>
        </SectionCard>

        <SectionCard className="lg:col-span-7" title="Conversation">
          {user.tickets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              size="sm"
              title="No tickets yet"
              description="Open one on the left and the conversation will appear here."
            />
          ) : (
            <div className="flex min-h-[360px] flex-col">
              <Tabs
                variant="pill"
                layoutGroup="tickets"
                aria-label="Your tickets"
                value={selectedTicketId ?? user.tickets[0].id}
                onChange={setSelectedTicketId}
                items={user.tickets.map((tkt) => ({
                  id: tkt.id,
                  // Was `subject.slice(0, 16) + "..."`, which appended an
                  // ellipsis even when the subject was short enough to fit.
                  label: tkt.subject.length > 18 ? `${tkt.subject.slice(0, 18)}…` : tkt.subject,
                }))}
              />

              <div
                className="my-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-line bg-panel p-3"
                role="log"
                aria-label="Ticket messages"
              >
                {activeTicketObj ? (
                  activeTicketObj.messages.map((m, idx) => {
                    const isSupport = m.sender === "support";
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isSupport ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={
                            "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed " +
                            (isSupport
                              ? "rounded-tl-sm border border-line bg-surface text-ink"
                              : "rounded-tr-sm bg-accent text-ground")
                          }
                        >
                          <p>{m.text}</p>
                          <span className="mt-1 block text-right text-2xs opacity-70">{m.time}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    size="sm"
                    title="Select a ticket"
                    description="Pick a ticket above to read its history."
                  />
                )}
              </div>

              {activeTicketObj && (
                <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    aria-label="Reply to ticket"
                    required
                    value={tktReplyTxt}
                    onChange={(e) => setTktReplyTxt(e.target.value)}
                    placeholder="Write a reply…"
                  />
                  <Button type="submit" size="icon" aria-label="Send reply">
                    <Send size={15} />
                  </Button>
                </form>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
