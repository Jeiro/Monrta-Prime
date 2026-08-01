import React, { useState } from "react";
import { useSiteSettings, DEFAULT_SITE_CONTENT } from "../../../context/domains/SiteSettingsContext";
import { motion } from "motion/react";
import { PenTool, Save, Check, RotateCcw } from "lucide-react";

export const AdminContentTab: React.FC = () => {
  const { siteContent, updateSiteContent } = useSiteSettings();
  const [form, setForm] = useState({ ...siteContent });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteContent(form);
      setFeedback("Content saved successfully!");
    } catch {
      setFeedback("Failed to save content.");
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_SITE_CONTENT });
    setFeedback("Form reset to defaults (not saved yet).");
    setTimeout(() => setFeedback(null), 3000);
  };

  const fields = [
    { key: "hero_title", label: "Hero Title", rows: 1 },
    { key: "hero_subtitle", label: "Hero Subtitle", rows: 1 },
    { key: "hero_button", label: "Hero Button Text", rows: 1 },
    { key: "dashboard_title", label: "Dashboard Title", rows: 1 },
    { key: "dashboard_description", label: "Dashboard Description", rows: 2 },
    { key: "investment_title", label: "Investment Page Title", rows: 1 },
    { key: "investment_description", label: "Investment Page Description", rows: 2 },
    { key: "footer_text", label: "Footer Text", rows: 2 },
    { key: "announcement_text", label: "Announcement Banner Text", rows: 2 },
    { key: "faq_question_1", label: "FAQ Question 1", rows: 1 },
    { key: "faq_answer_1", label: "FAQ Answer 1", rows: 2 },
    { key: "faq_question_2", label: "FAQ Question 2", rows: 1 },
    { key: "faq_answer_2", label: "FAQ Answer 2", rows: 2 },
    { key: "faq_question_3", label: "FAQ Question 3", rows: 1 },
    { key: "faq_answer_3", label: "FAQ Answer 3", rows: 2 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <PenTool size={20} className="text-accent" /> Content Editor
          </h1>
          <p className="text-xs text-muted mt-1">Edit all text content displayed on the public-facing website. Changes sync in real-time to Firestore.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-line/50 border border-line text-muted text-xs font-bold rounded-lg hover:text-ink cursor-pointer">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-accent text-ground text-xs font-bold uppercase rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-50">
            <Save size={12} /> {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key} className="bg-surface border border-line rounded-xl p-4 space-y-2">
            <label className="text-2xs font-bold text-muted uppercase tracking-wider">{field.label}</label>
            {field.rows > 1 ? (
              <textarea
                rows={field.rows}
                value={(form as any)[field.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none"
              />
            ) : (
              <input
                value={(form as any)[field.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-accent text-ground font-bold text-xs uppercase rounded-xl hover:opacity-90 cursor-pointer disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </motion.div>
  );
};
