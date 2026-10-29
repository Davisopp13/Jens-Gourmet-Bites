import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blankReview, type ReceiptFile, type ReceiptRecord } from "./types";
import { validateFile, fingerprint, MAX_BYTES, type IncomingFile } from "./validation";
import { isReceiptAdmin } from "./access";

export class ReceiptError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function receiptUser(request?: Request) {
  if (request && request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) throw new ReceiptError("Cross-site request rejected", 403);
  }
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.is_anonymous) throw new ReceiptError("Please sign in to the admin page.", 401);
  if (!isReceiptAdmin(user.id, process.env.RECEIPT_ADMIN_USER_IDS)) throw new ReceiptError("This account does not have access to receipt pricing tools.", 403);
  return user;
}
export function receiptFailure(error: unknown) {
  if (error instanceof ReceiptError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid receipt details" }, { status: 400 });
  // Do not log receipt contents, URLs or provider error bodies.
  console.error("Receipt operation failed", error instanceof Error ? error.name : "Database error");
  return NextResponse.json({ error: "The receipt could not be saved or loaded. Check receipt storage setup and try again." }, { status: 500 });
}
export async function findReceipt(id: string, owner: string): Promise<ReceiptRecord> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ReceiptError("Receipt not found", 404);
  const { data, error } = await createAdminClient().from("receipts").select("*").eq("id", id).eq("owner_id", owner).maybeSingle();
  if (error) throw error;
  if (!data) throw new ReceiptError("Receipt not found", 404);
  return data as ReceiptRecord;
}
export async function ingestReceipt(owner: string, incoming: IncomingFile[], metadata: { source: "upload" | "email"; sourceId?: string; subject?: string; sender?: string; text?: string }) {
  const media = incoming.filter(f => f.type !== "message/rfc822" && f.type !== "text/plain");
  if (incoming.length > 7 || incoming.reduce((n, f) => n + f.bytes.length, 0) > MAX_BYTES * 3) throw new ReceiptError("Receipt attachments are too large.");
  if (metadata.source === "upload" && (!media.length || media.length > 5 || media.reduce((n, f) => n + f.bytes.length, 0) > MAX_BYTES)) throw new ReceiptError("Choose up to five images or PDFs, at most 3 MB combined.");
  try { incoming.forEach(f => validateFile(f, metadata.source === "email")); }
  catch (error) { throw new ReceiptError(error instanceof Error ? error.message : "Invalid receipt file"); }
  const db = createAdminClient();
  // Include original email content: separate purchases often reuse identical inline store logos.
  const hash = fingerprint(incoming);
  const { data: duplicate, error: lookupError } = await db.from("receipts").select("*").eq("owner_id", owner).eq("fingerprint", hash).maybeSingle();
  if (lookupError) throw lookupError;
  if (duplicate) return { receipt: duplicate as ReceiptRecord, duplicate: true };
  if (metadata.sourceId) {
    const { data: prior, error } = await db.from("receipts").select("*").eq("owner_id", owner).eq("source_id", metadata.sourceId).maybeSingle();
    if (error) throw error;
    if (prior) return { receipt: prior as ReceiptRecord, duplicate: true };
  }
  const id = randomUUID(); const files: ReceiptFile[] = [];
  try {
    for (const file of incoming) {
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf", "text/plain": "txt", "message/rfc822": "eml" } as Record<string,string>)[file.type];
      const path = `${owner}/${id}/${randomUUID()}.${extension}`;
      const { error } = await db.storage.from("receipts").upload(path, file.bytes, { contentType: file.type, upsert: false });
      if (error) throw error;
      files.push({ path, name: file.name.slice(0, 200), type: file.type, size: file.bytes.length, sha256: createHash("sha256").update(file.bytes).digest("hex") });
    }
    const { data, error } = await db.from("receipts").insert({ id, owner_id: owner, source: metadata.source, source_id: metadata.sourceId ?? null, subject: metadata.subject?.slice(0, 300), sender: metadata.sender?.slice(0, 300), raw_text: metadata.text?.slice(0, 40000), fingerprint: hash, files, data: blankReview(), extraction_message: "Review the original and enter details, or use Read receipt to extract them." }).select().single();
    if (error) {
      if (error.code === "23505") {
        await db.storage.from("receipts").remove(files.map(f => f.path));
        const { data: winner } = await db.from("receipts").select("*").eq("owner_id", owner).eq("fingerprint", hash).maybeSingle();
        if (winner) return { receipt: winner as ReceiptRecord, duplicate: true };
      }
      throw error;
    }
    return { receipt: data as ReceiptRecord, duplicate: false };
  } catch (error) {
    if (files.length) await db.storage.from("receipts").remove(files.map(f => f.path));
    throw error;
  }
}
