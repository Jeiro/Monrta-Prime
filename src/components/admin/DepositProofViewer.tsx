import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { FileImage, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction } from "../../types";
import { useSupabaseClient } from "../../lib/supabase";
import { DEPOSIT_PROOF_BUCKET, GIFT_CARD_BUCKET, DepositProofLinks, type ProofBucket, type SignedProof } from "../../services/depositProofService";

export function DepositProofViewer({ transaction }: { transaction: Transaction }) {
  const supabase = useSupabaseClient();
  const { session } = useSession();
  const giftCard = transaction.paymentMethod === "gift_card";
  const paths = giftCard ? transaction.giftCardImagePaths || [] : transaction.proofFile ? [transaction.proofFile] : [];
  if (!paths.length) return <span className="text-xs text-muted">No images attached</span>;

  // Changing the account or evidence resets both UI state and its private cache.
  return <ProofImages key={JSON.stringify([session?.id, transaction.id, transaction.userId, giftCard, paths])}
    client={supabase} ownerId={transaction.userId || ""} paths={paths}
    bucket={giftCard ? GIFT_CARD_BUCKET : DEPOSIT_PROOF_BUCKET} giftCard={giftCard} />;
}

function ProofImages({ client, ownerId, paths, bucket, giftCard }: {
  client: SupabaseClient; ownerId: string; paths: string[]; bucket: ProofBucket; giftCard: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [proofs, setProofs] = useState<SignedProof[]>([]);
  const active = useRef(true);
  const loading = useRef(false);
  const links = useMemo(() => new DepositProofLinks(client, bucket, ownerId), [client, bucket, ownerId]);
  // The keyed parent remounts if paths change. Keep stable request dependencies.
  const pathKey = JSON.stringify(paths);
  const imagePaths = useMemo<string[]>(() => JSON.parse(pathKey), [pathKey]);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (loading.current) return;
    loading.current = true;
    setOpen(true);
    setBusy(true);
    try {
      const next = await links.load(imagePaths, refresh);
      if (active.current) setProofs(next);
    } finally {
      loading.current = false;
      if (active.current) setBusy(false);
    }
  }, [links, imagePaths]);

  // Refresh links while images remain open as well as when reopening them.
  useEffect(() => {
    if (!open || busy) return;
    const expirations = proofs.flatMap(proof => proof.url && proof.expiresAt ? [proof.expiresAt] : []);
    if (!expirations.length) return;
    const timer = window.setTimeout(() => void load(), Math.max(0, Math.min(...expirations) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [open, busy, proofs, load]);

  const failed = proofs.some(proof => proof.error);
  return <div className="mt-2 space-y-2">
    <button type="button" aria-expanded={open} disabled={busy} onClick={() => open ? setOpen(false) : void load()}
      className="flex min-h-11 items-center gap-2 text-sm font-bold text-accent disabled:opacity-50">
      {busy ? <Loader2 size={16} className="animate-spin" /> : <FileImage size={16} />}
      {open ? "Hide images" : `View ${paths.length} image${paths.length === 1 ? "" : "s"}`}
    </button>
    {open && <div aria-busy={busy} className="w-full min-w-0 space-y-3 [overflow-wrap:anywhere] rounded-lg border border-line bg-ground p-2">
      {busy && <p role="status" className="text-sm text-muted">Loading images…</p>}
      {proofs.map((proof, index) => <div key={`${index}:${proof.path}`}>
        {proof.error && <p role="alert" className="text-sm text-negative">Image {index + 1}: {proof.error}</p>}
        {proof.url && <a href={proof.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
          onClick={event => {
            if (busy || Date.now() >= proof.expiresAt!) {
              event.preventDefault();
              if (!busy) void load();
            }
          }} className="block min-h-11 text-sm text-accent">
          <img src={proof.url} alt={`${giftCard ? "Gift card" : "Deposit proof"} image ${index + 1}`} referrerPolicy="no-referrer"
            onError={() => {
              links.invalidate(proof.path);
              setProofs(current => current.map(item => item.path === proof.path
                ? { path: item.path, error: "Image failed to load. Retry loading images." } : item));
            }} className="mb-1 h-48 w-full rounded object-contain" />
          Open image {index + 1} full size
        </a>}
      </div>)}
      <button type="button" disabled={busy} onClick={() => void load(!failed)}
        className="min-h-11 text-sm text-accent underline disabled:opacity-50">{failed ? "Retry images" : "Refresh images"}</button>
    </div>}
  </div>;
}
