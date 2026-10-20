import assert from "node:assert/strict";
import test from "node:test";
import { DepositProofLinks, uploadProofImage, isOwnedProofPath, SIGNED_PROOF_SECONDS } from "../src/services/depositProofService";

const image = new File(["test-image"], "very-long-original-name..png", { type: "image/png" });
for (const bucket of ["deposit-proofs", "gift-card-proofs"] as const) {
  test(`${bucket}: upload requires confirmed storage path and propagates errors`, async () => {
    let calls = 0;
    const client = (result: (path: string) => any) => ({ storage: { from: (name: string) => {
      assert.equal(name, bucket);
      return { upload: async (path: string, body: File, options: any) => {
        calls++;
        assert.equal(body, image);
        assert.equal(options.upsert, false);
        assert.equal(options.contentType, "image/png");
        assert.match(path, /^owner\/[0-9a-f-]+\.png$/);
        return result(path);
      } };
    } } }) as any;
    assert.match(await uploadProofImage(client(path => ({ data: { path }, error: null })), bucket, "owner", image), /^owner\//);
    for (const result of [{ error: { message: "Storage denied" } }, { data: null, error: null }, { data: { path: "someone-else/fake.png" }, error: null }]) {
      await assert.rejects(uploadProofImage(client(() => result), bucket, "owner", image), /Proof upload failed/);
    }
    const before = calls;
    for (const bad of [new File([], "empty.png", { type: "image/png" }), new File(["svg"], "bad.svg", { type: "image/svg+xml" }), new File([new Uint8Array(5242881)], "big.png", { type: "image/png" })]) {
      await assert.rejects(uploadProofImage(client(() => ({})), bucket, "owner", bad), /5 MB/);
    }
    await assert.rejects(uploadProofImage(client(() => ({})), bucket, "", image), /sign in/);
    assert.equal(calls, before);
  });

  test(`${bucket}: signed links reuse valid entries, retry failures, expire and refresh`, async () => {
    let now = 1000;
    const calls: string[][] = [];
    let missing = true;
    let fail = false;
    const client = { storage: { from: (name: string) => {
      assert.equal(name, bucket);
      return { createSignedUrls: async (paths: string[], seconds: number) => {
        calls.push(paths);
        assert.equal(seconds, SIGNED_PROOF_SECONDS);
        if (fail) throw new Error("Network unavailable");
        return { error: null, data: [...paths].reverse().map(path => path.endsWith("b.png") && missing
          ? { path, error: "Denied", signedUrl: null }
          : { path, signedUrl: `https://test.invalid/${path}?token=${calls.length}`, error: null }) };
      } };
    } } } as any;
    const links = new DepositProofLinks(client, bucket, "owner", () => now);
    const paths = ["owner/a.png", "owner/b.png"];
    let result = await links.load(paths);
    assert.ok(result[0].url?.includes("a.png"));
    assert.ok(result[1].error);
    const first = result[0].url;
    missing = false;
    result = await links.load(paths);
    assert.deepEqual(calls[1], ["owner/b.png"]);
    assert.equal(result[0].url, first);
    assert.ok(result[1].url?.includes("b.png"));
    await links.load(paths);
    assert.equal(calls.length, 2, "closing/reopening valid images makes no request");
    now += SIGNED_PROOF_SECONDS * 1000;
    result = await links.load(paths);
    assert.deepEqual(calls[2], paths);
    assert.notEqual(result[0].url, first);
    links.invalidate(paths[0]);
    await links.load(paths);
    assert.deepEqual(calls[3], [paths[0]], "broken image retries only the failed path");
    fail = true;
    result = await links.load(paths, true);
    assert.ok(result.every(item => !item.url && item.error === "Network unavailable"));
    fail = false;
    await links.load(paths);
    assert.equal(calls.length, 6);
    const otherSession = new DepositProofLinks(client, bucket, "owner", () => now);
    await otherSession.load(paths);
    assert.equal(calls.length, 7, "a new viewer/client does not inherit another session's signed URLs");
  });
}

test("legacy filenames with dots remain viewable; invalid or foreign paths are never signed", async () => {
  assert.equal(isOwnedProofPath("owner/old..receipt.png", "owner"), true);
  let calls = 0;
  const client = { storage: { from: () => { calls++; throw Error("must not sign"); } } } as any;
  const paths = ["https://foreign/image.png", "other/proof.png", "owner/../other.png", "owner//proof.png", "receipt.png", "owner/./proof.png"];
  const result = await new DepositProofLinks(client, "deposit-proofs", "owner").load(paths);
  assert.ok(result.every(item => item.error && !item.url));
  assert.equal(calls, 0);
});
