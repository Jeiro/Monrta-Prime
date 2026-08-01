import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Building2, Check, Headphones, Mail, MessageCircle, Save } from "lucide-react";
import { useSiteSettings } from "../../../context/domains/SiteSettingsContext";
import { useNotifications } from "../../../context/domains/NotificationsContext";
import type { AppSettings } from "../../../types";
import { Button, Input, Textarea } from "../../ui";

const inputClass = "w-full px-4 py-3 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-60";
const labelClass = "text-2xs font-bold text-muted uppercase tracking-wider";

type FieldConfig = {
  key: keyof AppSettings;
  label: string;
  type?: string;
  optional?: boolean;
  multiline?: boolean;
  placeholder?: string;
};

const companyFields: FieldConfig[] = [
  { key: "companyName", label: "Company Name", placeholder: "Company name" },
  { key: "supportEmail", label: "Support Email", type: "email", placeholder: "support@example.com" },
  { key: "supportPhone", label: "Support Phone", type: "tel", placeholder: "+1 (000) 000-0000" },
  { key: "companyAddress", label: "Company Address", multiline: true, placeholder: "Business address" }
];

const emailFields: FieldConfig[] = [
  { key: "senderName", label: "Sender Name", placeholder: "Company support" },
  { key: "replyToEmail", label: "Reply-To Email", type: "email", optional: true, placeholder: "Optional reply-to address" }
];

const chatFields: FieldConfig[] = [
  { key: "tawkPropertyId", label: "Tawk Property ID", placeholder: "Property ID" },
  { key: "tawkWidgetId", label: "Tawk Widget ID", placeholder: "Widget ID" }
];

export const AdminSettingsTab: React.FC = () => {
  const { appSettings, updateAppSettings } = useSiteSettings();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState<AppSettings>(appSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!saving) setForm(appSettings);
  }, [appSettings, saving]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const handleChange = (key: keyof AppSettings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    try {
      await updateAppSettings(form);
      addNotification("Business settings saved successfully.");
      showFeedback("success", "Settings saved successfully.");
    } catch {
      showFeedback("error", "Settings could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (fields: FieldConfig[]) => fields.map(field => (
    <div key={field.key} className={field.multiline ? "sm:col-span-2" : undefined}>
      {field.multiline ? (
        <Textarea
          id={field.key}
          label={`${field.label}${field.optional ? " (Optional)" : ""}`}
          rows={4}
          value={form[field.key]}
          onChange={event => handleChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          disabled={saving}
        />
      ) : (
        <Input
          id={field.key}
          label={`${field.label}${field.optional ? " (Optional)" : ""}`}
          type={field.type || "text"}
          value={form[field.key]}
          onChange={event => handleChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          disabled={saving}
        />
      )}
    </div>
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Building2 size={20} className="text-accent" /> Settings
          </h1>
          <p className="text-xs text-muted mt-1">Manage business contact, email identity, and live chat configuration.</p>
        </div>
        <Button type="button" icon={Save} loading={saving} onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${feedback.type === "success" ? "bg-positive/10 border-positive/30 text-positive" : "bg-negative/10 border-negative/30 text-negative"}`}
        >
          {feedback.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
          {feedback.message}
        </motion.div>
      )}

      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink font-bold">
          <Headphones size={18} className="text-accent" /> Company Information
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {renderFields(companyFields)}
        </div>
      </section>

      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink font-bold">
          <Mail size={18} className="text-accent" /> Email Settings
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {renderFields(emailFields)}
        </div>
      </section>

      <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink font-bold">
          <MessageCircle size={18} className="text-accent" /> Live Chat
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {renderFields(chatFields)}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" size="lg" icon={Save} loading={saving} onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
      </div>
    </motion.div>
  );
};
