import React, { useState } from "react";
import { useWallet } from "../../../context/domains/WalletContext";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Search, CheckCircle, Clock, Trash2, Edit3, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export const AdminWalletFeedbackTab: React.FC = () => {
  const { walletFeedback, adminUpdateWalletFeedback, adminDeleteWalletFeedback } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const sortedFeedback = [...walletFeedback].sort((a, b) => {
    // Sort 'new' first, then by date descending
    if (a.status !== b.status) return a.status === "new" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredFeedback = sortedFeedback.filter(fb =>
    fb.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newCount = walletFeedback.filter(fb => fb.status === "new").length;

  const handleUpdateStatus = async (id: string, status: "new" | "reviewed") => {
    await adminUpdateWalletFeedback(id, status);
    toast.success(`Marked as ${status}`);
  };

  const handleAddNote = async (id: string) => {
    if (!noteText.trim()) return;
    await adminUpdateWalletFeedback(id, "reviewed", noteText.trim());
    toast.success("Note saved");
    setNoteText("");
    setExpandedFeedback(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this feedback?")) {
      await adminDeleteWalletFeedback(id);
      toast.success("Feedback deleted");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Wallet size={20} className="text-accent" /> Wallet Feedback
            </h1>
            <p className="text-xs text-muted mt-1">Review user requests for new Web3 wallet integrations.</p>
          </div>
          {newCount > 0 && (
            <span className="flex items-center gap-2 text-2xs font-bold text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-full">
              <Clock size={12} /> {newCount} New Submissions
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="text"
          placeholder="Search by user, email, or wallet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-line rounded-xl pl-12 pr-4 py-3 text-sm text-ink placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredFeedback.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-surface border border-line rounded-2xl">
              <Wallet size={48} className="mx-auto text-muted opacity-50 mb-4" />
              <p className="text-muted">No wallet feedback found.</p>
            </motion.div>
          ) : (
            filteredFeedback.map(fb => (
              <motion.div
                key={fb.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-surface border rounded-2xl overflow-hidden transition-colors ${
                  fb.status === "new" ? "border-accent/30" : "border-line"
                }`}
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider ${
                        fb.status === "new" 
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "bg-positive/10 text-positive border border-positive/30"
                      }`}>
                        {fb.status}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                      {fb.wouldUse && (
                        <span className="text-2xs font-bold text-positive flex items-center gap-1">
                          <CheckCircle size={10} /> Committed User
                        </span>
                      )}
                    </div>
                    <h3 className="text-ink font-bold text-lg mb-1">{fb.wallet}</h3>
                    <p className="text-sm text-muted truncate">
                      {fb.userName} • {fb.userEmail}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {fb.status === "new" ? (
                      <button
                        onClick={() => handleUpdateStatus(fb.id, "reviewed")}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg bg-positive/10 text-positive hover:bg-positive/20 border border-positive/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} /> Review
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(fb.id, "new")}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} /> Mark New
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (expandedFeedback === fb.id) {
                          setExpandedFeedback(null);
                        } else {
                          setExpandedFeedback(fb.id);
                          setNoteText(fb.adminNotes || "");
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-ground text-muted hover:text-ink border border-line transition-colors flex items-center gap-2"
                    >
                      <Edit3 size={14} /> Notes
                    </button>
                    <button
                      onClick={() => handleDelete(fb.id)}
                      className="p-1.5 text-negative hover:bg-negative/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedFeedback === fb.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-line bg-ground/50"
                    >
                      <div className="p-4 sm:p-6 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">User's Purpose</h4>
                          <p className="text-sm text-ink bg-ground border border-line rounded-xl p-4 whitespace-pre-wrap">
                            {fb.reason}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Admin Notes</h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add an internal note..."
                              className="flex-1 bg-ground border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                              onKeyDown={(e) => e.key === "Enter" && handleAddNote(fb.id)}
                            />
                            <button
                              onClick={() => handleAddNote(fb.id)}
                              disabled={!noteText.trim()}
                              className="px-4 py-2 bg-accent hover:bg-accent-hover text-surface text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                              Save Note
                            </button>
                          </div>
                          {fb.adminNotes && (
                            <p className="text-xs text-accent mt-2 flex items-center gap-1">
                              <CheckCircle size={12} /> Note saved
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
