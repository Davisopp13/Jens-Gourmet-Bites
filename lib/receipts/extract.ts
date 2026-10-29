import "server-only";
import type { ReceiptRecord } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";
import { readReceipt } from "./reader";

export async function extractReceipt(receipt: ReceiptRecord) {
  const db = createAdminClient();
  const files = [];
  for (const file of receipt.files.filter(f => f.type.startsWith("image/") || f.type === "application/pdf")) {
    const { data, error } = await db.storage.from("receipts").download(file.path);
    if (error || !data) throw new Error("Original receipt unavailable");
    files.push({ name: file.name, type: file.type, bytes: Buffer.from(await data.arrayBuffer()) });
  }
  return readReceipt(files, {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.RECEIPT_EXTRACTION_MODEL,
    text: receipt.raw_text ?? "",
  });
}
