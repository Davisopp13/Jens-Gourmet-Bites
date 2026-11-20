import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { imageUploadError, uploadProductImage } from "../lib/product-images";

function storageHarness(status = 200, message = "") {
  const requests: Request[] = [];
  const client = createClient("https://synthetic.supabase.co", "synthetic-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      return Response.json(status === 200 ? { Key: "product-images/image.jpg" }
        : { statusCode: String(status), error: "StorageError", message }, { status });
    } },
  });
  return { client, requests };
}

test("iPhone converted photo uploads raw bytes with matching JPEG metadata, regardless of filename", async () => {
  const h = storageHarness();
  const bytes = new Uint8Array([255, 216, 255, 224]);
  const file = new File([bytes], "IMG_1234.HEIC", { type: "image/jpeg" });
  const url = await uploadProductImage(h.client, file);
  assert.equal(h.requests.length, 1);
  const request = h.requests[0];
  assert.match(new URL(request.url).pathname, /\/storage\/v1\/object\/product-images\/[\w-]+\.jpg$/);
  assert.equal(request.headers.get("Content-Type"), "image/jpeg");
  assert.equal(request.headers.get("x-upsert"), "false");
  assert.deepEqual(new Uint8Array(await request.arrayBuffer()), bytes);
  assert.match(url, /\/storage\/v1\/object\/public\/product-images\/[\w-]+\.jpg$/);
});

test("an image with an empty MIME type uses a recognized extension", async () => {
  const h = storageHarness();
  await uploadProductImage(h.client, new File(["image"], "screenshot.PNG"));
  assert.equal(h.requests[0].headers.get("Content-Type"), "image/png");
});

test("unsupported, empty, oversized and unreadable files never reach storage", async () => {
  const h = storageHarness();
  for (const [file, error] of [
    [new File(["heic"], "IMG.HEIC", { type: "image/heic" }), /export it as JPG/],
    [new File([], "empty.png", { type: "image/png" }), /empty/],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }), /5 MB/],
  ] as const) await assert.rejects(uploadProductImage(h.client, file), error);

  const file = new File(["photo"], "cloud.jpg", { type: "image/jpeg" });
  file.arrayBuffer = async () => { throw new DOMException("The requested file could not be read", "NotReadableError"); };
  await assert.rejects(uploadProductImage(h.client, file), /Open it in Photos/);
  assert.equal(h.requests.length, 0);
});

test("storage permission and configuration errors remain distinguishable", async () => {
  for (const [status, message, expected] of [
    [403, "new row violates row-level security policy", /upload permissions/],
    [400, "Bucket not found", /not configured/],
    [401, "jwt expired", /Sign in again/],
    [413, "Payload too large", /smaller image/],
  ] as const) {
    const h = storageHarness(status, message);
    await assert.rejects(uploadProductImage(h.client, new File(["image"], "a.png", { type: "image/png" })), (error) => {
      assert.match(imageUploadError(error), expected);
      return true;
    });
  }
  assert.match(imageUploadError(new TypeError("Load failed")), /connection/);
});
