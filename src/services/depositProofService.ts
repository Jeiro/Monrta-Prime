import type { SupabaseClient } from "@supabase/supabase-js";

export const DEPOSIT_PROOF_BUCKET = "deposit-proofs";
export const GIFT_CARD_BUCKET = "gift-card-proofs";
export type ProofBucket = typeof DEPOSIT_PROOF_BUCKET | typeof GIFT_CARD_BUCKET;
export const PROOF_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PROOF_IMAGE_BYTES = 5 * 1024 * 1024;
export const SIGNED_PROOF_SECONDS = 300;

export function proofErrorMessage(error: unknown, fallback: string): string {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message : fallback;
}

export function isOwnedProofPath(path: string, userId: string): boolean {
  const parts = path.split("/");
  return !!userId && parts.length >= 2 && parts[0] === userId
    && !path.includes("\\") && !path.includes(":")
    && parts.every(part => !!part && part !== "." && part !== "..");
}

export async function uploadProofImage(supabase: SupabaseClient, bucket: ProofBucket, userId: string, file: File): Promise<string> {
  if (!userId || userId.includes("/")) throw new Error("Please sign in before uploading proof.");
  if (!PROOF_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_PROOF_IMAGE_BYTES) {
    throw new Error("Use a non-empty JPG, PNG or WebP image no larger than 5 MB.");
  }
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    // Never save a filename or a guessed path after an incomplete upload response.
    if (!data?.path || data.path !== path) throw new Error("Storage did not confirm the uploaded proof path.");
    return data.path;
  } catch (error) {
    throw new Error(`Proof upload failed: ${proofErrorMessage(error, "Please check your connection and retry.")}`);
  }
}

export const uploadDepositProof = (supabase: SupabaseClient, userId: string, file: File) =>
  uploadProofImage(supabase, DEPOSIT_PROOF_BUCKET, userId, file);

export interface SignedProof {
  path: string;
  url?: string;
  expiresAt?: number;
  error?: string;
}

// One instance per mounted viewer/authenticated client. URLs never enter local
// storage, transaction rows, or a cache shared between signed-in users.
export class DepositProofLinks {
  private links = new Map<string, SignedProof>();

  constructor(private client: SupabaseClient, private bucket: ProofBucket, private ownerId: string, private now = Date.now) {}

  invalidate(path: string) { this.links.delete(path); }

  async load(paths: string[], refresh = false): Promise<SignedProof[]> {
    const results = new Map<string, SignedProof>();
    const pending: string[] = [];
    for (const path of new Set(paths)) {
      if (!isOwnedProofPath(path, this.ownerId)) {
        results.set(path, { path, error: "This record does not contain an accessible owner-scoped upload path." });
        continue;
      }
      const cached = this.links.get(path);
      if (!refresh && cached?.url && cached.expiresAt! > this.now()) results.set(path, cached);
      else pending.push(path);
    }
    if (pending.length) {
      // Count from request start and leave a margin for transport/clock delays.
      const expiresAt = this.now() + SIGNED_PROOF_SECONDS * 1000 - 5000;
      try {
        const { data, error } = await this.client.storage.from(this.bucket).createSignedUrls(pending, SIGNED_PROOF_SECONDS);
        if (error) throw error;
        for (const path of pending) {
          const item = data?.find(item => item.path === path);
          const result: SignedProof = item?.signedUrl && !item.error && expiresAt > this.now()
            ? { path, url: item.signedUrl, expiresAt }
            : { path, error: "Image unavailable, access denied, or link expired. Retry loading images." };
          if (result.url) this.links.set(path, result);
          else this.links.delete(path);
          results.set(path, result);
        }
      } catch (error) {
        for (const path of pending) {
          this.links.delete(path);
          results.set(path, { path, error: proofErrorMessage(error, "Unable to load image. Please retry.") });
        }
      }
    }
    return paths.map(path => results.get(path)!);
  }
}
