import type { SupabaseClient } from "@supabase/supabase-js";
import type { GiftCardDetails } from "../types";

import { GIFT_CARD_BUCKET, PROOF_IMAGE_TYPES, MAX_PROOF_IMAGE_BYTES, uploadProofImage } from "./depositProofService";
export { GIFT_CARD_BUCKET } from "./depositProofService";
export const GIFT_CARD_BRANDS = ["Amazon", "Apple", "Steam", "Google Play", "Razer Gold", "Visa"] as const;
export const MAX_GIFT_CARD_IMAGES = 4;
export const MAX_GIFT_CARD_IMAGE_BYTES = MAX_PROOF_IMAGE_BYTES;
export const GIFT_CARD_IMAGE_TYPES = PROOF_IMAGE_TYPES;

export function validateGiftCard(details: GiftCardDetails, amount: number, files: File[]): string | null {
  if (!details.brand.trim() || details.brand.trim().length > 80) return "Enter the gift card brand (up to 80 characters).";
  if (!Number.isFinite(details.faceValue) || details.faceValue <= 0) return "Enter a valid card face value.";
  if (!/^[A-Z]{3}$/.test(details.currency)) return "Enter the card's three-letter currency code, such as USD, GBP or EUR.";
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid requested deposit amount in USD.";
  if (files.length < 1 || files.length > MAX_GIFT_CARD_IMAGES) return `Upload between 1 and ${MAX_GIFT_CARD_IMAGES} gift card images.`;
  if (files.some(file => !GIFT_CARD_IMAGE_TYPES.includes(file.type))) return "Use JPG, PNG or WebP images only.";
  if (files.some(file => file.size === 0 || file.size > MAX_GIFT_CARD_IMAGE_BYTES)) return "Each image must be non-empty and no larger than 5 MB.";
  return null;
}

export async function uploadGiftCardImage(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  return uploadProofImage(supabase, GIFT_CARD_BUCKET, userId, file);
}
