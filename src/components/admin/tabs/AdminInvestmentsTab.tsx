import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Check, Edit3, Layers, Pause, Play, Plus, Save, Trash2, X } from "lucide-react";
import { useInvestmentPlans } from "../../../context/domains/InvestmentPlansContext";
import { Button, Input, Textarea } from "../../ui";
import type { InvestmentPlan } from "../../../types";

type PlanForm = {
  name: string;
  description: string;
  minDeposit: string;
  maxDeposit: string;
  roiPercent: string;
  durationDays: string;
  enabled: boolean;
  displayOrder: string;
  badge: string;
  accentColor: string;
};

const emptyForm = (nextOrder = 10): PlanForm => ({
  name: "",
  description: "",
  minDeposit: "",
  maxDeposit: "",
  roiPercent: "",
  durationDays: "",
  enabled: true,
  displayOrder: String(nextOrder),
  badge: "",
  accentColor: ""
});

const planToForm = (plan: InvestmentPlan): PlanForm => ({
  name: plan.name,
  description: plan.description,
  minDeposit: String(plan.minDeposit),
  maxDeposit: String(plan.maxDeposit),
  roiPercent: String(plan.roiPercent),
  durationDays: String(plan.durationDays),
  enabled: plan.enabled,
  displayOrder: String(plan.displayOrder),
  badge: plan.badge || "",
  accentColor: plan.accentColor || ""
});

const parsePositiveNumber = (value: string) => Number(value);

export const AdminInvestmentsTab: React.FC = () => {
  const { plans, adminCreatePlan, adminUpdatePlan, adminDeletePlan, adminSetPlanStatus } = useInvestmentPlans();
  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.displayOrder - b.displayOrder || a.minDeposit - b.minDeposit), [plans]);
  const nextOrder = orderedPlans.length ? Math.max(...orderedPlans.map((plan) => plan.displayOrder)) + 10 : 10;

  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PlanForm>(emptyForm(nextOrder));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const resetForm = () => {
    setFormData(emptyForm(nextOrder));
    setIsCreating(false);
    setEditingPlan(null);
  };

  const validateForm = () => {
    const minDeposit = parsePositiveNumber(formData.minDeposit);
    const maxDeposit = parsePositiveNumber(formData.maxDeposit);
    const roiPercent = parsePositiveNumber(formData.roiPercent);
    const durationDays = parseInt(formData.durationDays, 10);
    const displayOrder = parseInt(formData.displayOrder, 10);

    if (!formData.name.trim()) return { error: "Plan name is required." };
    if (!formData.description.trim()) return { error: "Description is required." };
    if (!Number.isFinite(minDeposit) || minDeposit < 0) return { error: "Minimum investment must be a valid amount." };
    if (!Number.isFinite(maxDeposit) || maxDeposit <= 0) return { error: "Maximum investment must be greater than 0." };
    if (maxDeposit < minDeposit) return { error: "Maximum investment must be greater than or equal to minimum investment." };
    if (!Number.isFinite(roiPercent) || roiPercent <= 0) return { error: "ROI must be greater than 0." };
    if (!Number.isFinite(durationDays) || durationDays <= 0) return { error: "Duration must be at least 1 day." };
    if (!Number.isFinite(displayOrder)) return { error: "Display order must be a valid number." };

    return {
      plan: {
        name: formData.name.trim(),
        description: formData.description.trim(),
        minDeposit,
        maxDeposit,
        durationDays,
        roiPercent,
        roiCapPercent: roiPercent,
        enabled: formData.enabled,
        status: formData.enabled ? "active" as const : "paused" as const,
        displayOrder,
        badge: formData.badge.trim() || undefined,
        accentColor: formData.accentColor.trim() || undefined
      }
    };
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    const validated = validateForm();
    if (validated.error || !validated.plan) {
      showFeedback(validated.error || "Unable to save plan.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlan) {
        await adminUpdatePlan({ ...editingPlan, ...validated.plan });
        showFeedback(`Updated plan: ${validated.plan.name}`);
      } else {
        await adminCreatePlan(validated.plan);
        showFeedback(`Created plan: ${validated.plan.name}`);
      }
      resetForm();
    } catch {
      showFeedback("Unable to save plan. Confirm admin permissions and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const startCreate = () => {
    setEditingPlan(null);
    setIsCreating(true);
    setFormData(emptyForm(nextOrder));
  };

  const startEdit = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    setIsCreating(false);
    setFormData(planToForm(plan));
  };

  const movePlan = async (plan: InvestmentPlan, direction: "up" | "down") => {
    const currentIndex = orderedPlans.findIndex((item) => item.id === plan.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetPlan = orderedPlans[targetIndex];
    if (!targetPlan) return;

    if (isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all([
        adminUpdatePlan({ ...plan, displayOrder: targetPlan.displayOrder }),
        adminUpdatePlan({ ...targetPlan, displayOrder: plan.displayOrder })
      ]);
      showFeedback(`Moved ${plan.name} ${direction}.`);
    } catch {
      showFeedback("Unable to update display order. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormOpen = isCreating || Boolean(editingPlan);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Layers size={20} className="text-accent" /> Investment Plans
          </h1>
          <p className="text-xs text-muted mt-1">Manage Firestore-backed plans, status, badges, colors, and display order.</p>
        </div>
        <Button onClick={startCreate} icon={Plus}>New Plan</Button>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {isFormOpen && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">{editingPlan ? `Editing: ${editingPlan.name}` : "Create New Plan"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Close plan form"><X size={14} /></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input label="Plan name" placeholder="Plan Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            <Input label="Min investment" type="number" prefix="$" numeric placeholder="0" value={formData.minDeposit} onChange={e => setFormData(f => ({ ...f, minDeposit: e.target.value }))} />
            <Input label="Max investment" type="number" prefix="$" numeric placeholder="0" value={formData.maxDeposit} onChange={e => setFormData(f => ({ ...f, maxDeposit: e.target.value }))} />
            <Input label="ROI" type="number" suffix="%" numeric placeholder="0" value={formData.roiPercent} onChange={e => setFormData(f => ({ ...f, roiPercent: e.target.value }))} min="0.1" step="0.1" />
            <Input label="Duration" type="number" suffix="days" numeric placeholder="0" value={formData.durationDays} onChange={e => setFormData(f => ({ ...f, durationDays: e.target.value }))} min="1" />
            <Input label="Display order" type="number" numeric placeholder="0" value={formData.displayOrder} onChange={e => setFormData(f => ({ ...f, displayOrder: e.target.value }))} />
            <Input label="Badge" placeholder="Optional" value={formData.badge} onChange={e => setFormData(f => ({ ...f, badge: e.target.value }))} />
            <Input label="Accent colour" placeholder="Optional" value={formData.accentColor} onChange={e => setFormData(f => ({ ...f, accentColor: e.target.value }))} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Textarea label="Description" rows={3} placeholder="Description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Raw checkbox on purpose: Input renders a full-width text field
                with the label ABOVE it, which is the wrong control shape for a
                boolean. There is no Checkbox primitive yet — adding one is its
                own piece of work, not part of this conversion pass. */}
            <label className="flex items-center gap-2 self-end px-3 py-2.5 bg-panel border border-line rounded-lg text-xs text-ink cursor-pointer">
              <input type="checkbox" checked={formData.enabled} onChange={e => setFormData(f => ({ ...f, enabled: e.target.checked }))} className="accent-accent" />
              Enabled
            </label>
          </div>

          <Button onClick={handleSubmit} loading={isSaving} icon={Save}>
            {editingPlan ? "Save Changes" : "Create Plan"}
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderedPlans.map((plan, index) => (
          <div key={plan.id} className="bg-surface border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {plan.accentColor && <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: plan.accentColor }} />}
                  <h3 className="text-sm font-bold text-ink">{plan.name}</h3>
                </div>
                <p className="text-2xs text-muted mt-1">Order {plan.displayOrder}{plan.badge ? ` | ${plan.badge}` : ""}</p>
              </div>
              <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${plan.enabled ? "text-positive bg-positive/10 border-positive/30" : "text-warning bg-warning-soft border-warning-line"}`}>
                {plan.enabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted">Min:</span> <span className="text-ink font-bold font-data ml-1">${plan.minDeposit.toLocaleString()}</span></div>
              <div><span className="text-muted">Max:</span> <span className="text-ink font-bold font-data ml-1">${plan.maxDeposit.toLocaleString()}</span></div>
              <div><span className="text-muted">Duration:</span> <span className="text-ink font-bold font-data ml-1">{plan.durationDays}d</span></div>
              <div><span className="text-muted">ROI:</span> <span className="text-accent font-bold font-data ml-1">{plan.roiPercent}%</span></div>
            </div>
            <p className="text-2xs text-muted leading-relaxed line-clamp-2">{plan.description}</p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-line/50">
              <Button variant="secondary" size="sm" onClick={() => movePlan(plan, "up")} disabled={isSaving || index === 0} aria-label={`Move ${plan.name} up`}><ArrowUp size={12} /></Button>
              <Button variant="secondary" size="sm" onClick={() => movePlan(plan, "down")} disabled={isSaving || index === orderedPlans.length - 1} aria-label={`Move ${plan.name} down`}><ArrowDown size={12} /></Button>
              <Button variant="secondary" size="sm" icon={Edit3} onClick={() => startEdit(plan)} className="flex-1">Edit</Button>
              <Button onClick={async () => {
                  try {
                    if (isSaving) return;
                    setIsSaving(true);
                    await adminSetPlanStatus(plan.id, plan.enabled ? "paused" : "active");
                    showFeedback(`${plan.name} ${plan.enabled ? "disabled" : "enabled"}.`);
                  } catch {
                    showFeedback("Unable to update plan status. Try again.");
                  } finally {
                    setIsSaving(false);
                  }
                }} variant={plan.enabled ? "secondary" : "positive"} size="sm" icon={plan.enabled ? Pause : Play} className="flex-1">
                {plan.enabled ? "Disable" : "Enable"}
              </Button>
              <Button onClick={async () => {
                  if (isSaving || !window.confirm(`Delete "${plan.name}"?`)) return;
                  setIsSaving(true);
                  try {
                    await adminDeletePlan(plan.id);
                    showFeedback(`Deleted plan: ${plan.name}`);
                  } catch {
                    showFeedback("Unable to delete plan. Try again.");
                  } finally {
                    setIsSaving(false);
                  }
                }} variant="danger" size="sm" aria-label={`Delete ${plan.name}`}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

