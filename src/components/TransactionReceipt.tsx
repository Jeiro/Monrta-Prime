import React, { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge, Button, Drawer } from "./ui";
import { formatDateTime, formatMoney } from "../lib/format";
import type { Transaction, TransactionStatus } from "../types";

/**
 * Read-only detail view for one transaction.
 *
 * The Transaction type carries a lot the list views never showed — address,
 * txHash, proofFile, notes, destinationTag, bankDetails, paypalEmail,
 * relatedReferenceId. This surfaces it on demand rather than widening every
 * row.
 *
 * One component, used from all three places a user sees their own history
 * (DashboardTransactions, DashboardOverview, DashboardWallet), so the
 * receipt cannot drift between them.
 *
 * STRICTLY READ-ONLY. No approve/reject, no editing, no status changes —
 * this mirrors AdminWithdrawalsTab's Drawer layout but deliberately not its
 * actions. It also issues no query of its own: callers pass a row out of
 * `user.transactions`, which is already scoped to the signed-in user, so
 * there is no path here that could read another account's data.
 */

const STATUS_TONE: Record<TransactionStatus, "positive" | "warning" | "negative" | "neutral"> = {
  completed: "positive",
  approved: "positive",
  pending: "warning",
  failed: "negative",
  rejected: "negative",
};

const CREDIT_TYPES = ["deposit", "payout"];
const DEBIT_TYPES = ["withdrawal", "investment"];

/** Treated as an image if it looks like one; anything else gets a plain link. */
const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif)(\?|$)/i;

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/** Plain label/value row. */
function Field({ label, children }: FieldProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Label/value row with a copy control.
 *
 * Same treatment as the deposit destination tag in DashboardWallet: a
 * select-all font-data value, a secondary icon button that swaps to a
 * positive check for two seconds, and an aria-live region so the
 * confirmation is announced rather than only shown.
 */
function CopyField({
  label,
  value,
  copiedLabel,
}: {
  label: string;
  value: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  // Clears the timer if the drawer closes mid-countdown, which would
  // otherwise set state on an unmounted component.
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
        {label}
      </span>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <span className="min-w-0 select-all break-all font-data text-xs text-ink">{value}</span>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
          }}
        >
          {copied ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
        </Button>
      </div>
      <span aria-live="polite" className="sr-only">
        {copied ? `${copiedLabel} copied to clipboard` : ""}
      </span>
    </div>
  );
}

export interface TransactionReceiptProps {
  /** The row to show. `null` closes the drawer. */
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ transaction, onClose }) => {
  const tx = transaction;
  const isCredit = tx ? CREDIT_TYPES.includes(tx.type) : false;
  const isDebit = tx ? DEBIT_TYPES.includes(tx.type) : false;
  const bank = tx?.bankDetails;

  return (
    <Drawer
      open={Boolean(tx)}
      onClose={onClose}
      title={tx ? <span className="capitalize">{tx.type} receipt</span> : ""}
    >
      {tx && (
        <div className="space-y-4">
          {/* Headline: amount and status, the two things being looked up. */}
          <div className="flex items-center justify-between gap-3">
            <Badge tone={STATUS_TONE[tx.status] ?? "neutral"}>{tx.status}</Badge>
            <span
              className={`font-data text-lg font-semibold tabular-nums ${
                isCredit ? "text-positive" : "text-ink"
              }`}
            >
              {isCredit ? "+" : isDebit ? "−" : ""}
              {formatMoney(tx.amount)}
            </span>
          </div>

          {/* Always present. */}
          <dl className="space-y-3">
            <Field label="Type">
              <span className="capitalize">{tx.type}</span>
            </Field>
            {(tx.currency || tx.asset) && <Field label="Asset">{tx.currency || tx.asset}</Field>}
            <Field label="Date">{formatDateTime(tx.timestamp || tx.date)}</Field>
          </dl>

          {/* Copyable identifiers — the fields someone takes to a block
              explorer or quotes in a support ticket. */}
          <div className="space-y-2">
            <CopyField label="Transaction ID" value={tx.id} copiedLabel="Transaction ID" />
            {tx.txHash && (
              <CopyField label="Transaction hash" value={tx.txHash} copiedLabel="Transaction hash" />
            )}
            {tx.address && (
              <CopyField label="Address" value={tx.address} copiedLabel="Address" />
            )}
          </div>

          {/* Everything below renders only when populated — a receipt padded
              with empty rows is harder to read than a short one. */}
          {tx.destinationTag && (
            <dl className="space-y-3">
              <Field label="Destination tag">
                <span className="font-data">{tx.destinationTag}</span>
              </Field>
            </dl>
          )}

          {bank && (
            <div className="rounded-xl border border-line bg-panel p-3">
              <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                Bank transfer
              </span>
              <dl className="mt-2 space-y-2">
                {bank.accountName && <Field label="Account name">{bank.accountName}</Field>}
                {bank.bankName && <Field label="Bank">{bank.bankName}</Field>}
                {bank.accountNumber && (
                  <Field label="Account number">
                    <span className="font-data">{bank.accountNumber}</span>
                  </Field>
                )}
                {bank.routingCode && (
                  <Field label="Routing code">
                    <span className="font-data">{bank.routingCode}</span>
                  </Field>
                )}
              </dl>
            </div>
          )}

          {(tx.paypalEmail || tx.relatedReferenceId || tx.notes) && (
            <dl className="space-y-3">
              {tx.paypalEmail && <Field label="PayPal">{tx.paypalEmail}</Field>}
              {tx.relatedReferenceId && (
                <Field label="Reference">
                  <span className="font-data text-xs">{tx.relatedReferenceId}</span>
                </Field>
              )}
              {tx.notes && <Field label="Notes">{tx.notes}</Field>}
            </dl>
          )}

          {tx.proofFile && (
            <div className="rounded-xl border border-line bg-panel p-3">
              <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                Payment proof
              </span>
              {IMAGE_RE.test(tx.proofFile) ? (
                <a
                  href={tx.proofFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block overflow-hidden rounded-lg border border-line"
                >
                  <img
                    src={tx.proofFile}
                    alt="Payment proof uploaded with this transaction"
                    className="max-h-56 w-full object-contain"
                  />
                </a>
              ) : (
                <a
                  href={tx.proofFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all font-data text-xs text-accent underline underline-offset-2"
                >
                  {tx.proofFile}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
