import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/**
 * Inline form feedback.
 *
 * Distinct from a toast on purpose: a toast is for something that happened
 * elsewhere and will disappear, an Alert is for something about *this form*
 * that must stay on screen while the user fixes it. Validation errors were
 * being rendered as ad-hoc coloured divs on every form, each with its own
 * padding and border opacity.
 *
 * Errors get `role="alert"` so they're announced immediately — a validation
 * message that is only visible is no message at all for a screen reader
 * user who just pressed submit.
 */

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "border-accent-line bg-accent-soft text-accent", Icon: Info },
  success: { box: "border-positive-line bg-positive-soft text-positive", Icon: CheckCircle2 },
  warning: { box: "border-warning-line bg-warning-soft text-warning", Icon: AlertTriangle },
  error: { box: "border-negative-line bg-negative-soft text-negative", Icon: XCircle },
};

export interface AlertProps {
  tone?: Tone;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className = "" }: AlertProps) {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs ${box} ${className}`}
    >
      <Icon size={15} className="mt-px shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div className="[&_a]:underline">{children}</div>
      </div>
    </div>
  );
}
