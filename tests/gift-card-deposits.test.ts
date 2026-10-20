import assert from "node:assert/strict";
import test from "node:test";
import { validateGiftCard, uploadGiftCardImage, MAX_GIFT_CARD_IMAGE_BYTES } from "../src/services/giftCardService";

const details = { brand: "Test card", faceValue: 100, currency: "USD" };
const image = new File([new Uint8Array([1, 2, 3])], "card.png", { type: "image/png" });

test("gift card validation rejects missing images, invalid amounts and unsafe files", () => {
  assert.equal(validateGiftCard(details, 90, [image]), null);
  for (const amount of [0, -1, NaN, Infinity]) assert.ok(validateGiftCard(details, amount, [image]));
  assert.ok(validateGiftCard({ ...details, faceValue: -1 }, 90, [image]));
  assert.ok(validateGiftCard({ ...details, brand: " " }, 90, [image]));
  assert.ok(validateGiftCard({ ...details, currency: "US" }, 90, [image]));
  assert.ok(validateGiftCard(details, 90, []));
  assert.ok(validateGiftCard(details, 90, Array(5).fill(image)));
  assert.ok(validateGiftCard(details, 90, [new File(["<svg />"], "card.svg", { type: "image/svg+xml" })]));
  assert.ok(validateGiftCard(details, 90, [new File([], "empty.png", { type: "image/png" })]));
  assert.ok(validateGiftCard(details, 90, [new File([new Uint8Array(MAX_GIFT_CARD_IMAGE_BYTES + 1)], "big.png", { type: "image/png" })]));
});

test("uploads use a private bucket and generated owner-scoped paths; failures propagate", async () => {
  let uploadedPath = "";
  const client = { storage: { from(bucket: string) {
    assert.equal(bucket, "gift-card-proofs");
    return { async upload(path: string, file: File, options: any) {
      uploadedPath = path;
      assert.equal(file, image);
      assert.equal(options.upsert, false);
      return { data: { path }, error: null };
    } };
  } } } as any;
  assert.equal(await uploadGiftCardImage(client, "user_a", image), uploadedPath);
  assert.match(uploadedPath, /^user_a\/[0-9a-f-]+\.png$/);
  await assert.rejects(uploadGiftCardImage(client, "", image));
  const failing = { storage: { from: () => ({ upload: async () => ({ error: new Error("Upload failed") }) }) } } as any;
  await assert.rejects(uploadGiftCardImage(failing, "user_a", image), /Upload failed/);
});
