import { createHash } from "node:crypto";
export const MAX_BYTES = 3 * 1024 * 1024;
export type IncomingFile = { name: string; type: string; bytes: Buffer };
export function validateFile(file: IncomingFile, email = false) {
  if (!file.bytes.length || file.bytes.length > MAX_BYTES * (email ? 2 : 1)) throw new Error("File is empty or too large.");
  const b=file.bytes;
  const valid = file.type === "image/jpeg" ? b[0]===255 && b[1]===216 && b[2]===255
    : file.type === "image/png" ? b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : file.type === "image/webp" ? b.toString("ascii",0,4)==="RIFF" && b.toString("ascii",8,12)==="WEBP"
    : file.type === "application/pdf" ? b.toString("ascii",0,5)==="%PDF-"
    : email && ["message/rfc822","text/plain"].includes(file.type);
  if (!valid) throw new Error("Use a valid JPEG, PNG, WebP or PDF receipt.");
}
export function fingerprint(files: IncomingFile[]) {
  return createHash("sha256").update(files.map(f=>createHash("sha256").update(f.bytes).digest("hex")).sort().join(":" )).digest("hex");
}
export async function readLimited(response: Response, limit: number): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error("Could not retrieve receipt content.");
  const reader=response.body.getReader(); const chunks: Uint8Array[]=[]; let length=0;
  try { while (true) { const {done,value}=await reader.read(); if(done) break; length+=value.length; if(length>limit) throw new Error("Receipt content exceeds the size limit."); chunks.push(value); } }
  catch(error) { await reader.cancel(); throw error; }
  return Buffer.concat(chunks);
}
export function csvCell(value: unknown) { const s=String(value ?? ""); return '"'+(/^[\s]*[=+@\-]/.test(s)?"'":"")+s.replace(/"/g,'""')+'"'; }

export function emailAddress(value: string) { return (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase(); }
export function allowedReceiptSender(sender: string, allowlist: string) {
  const address = emailAddress(sender);
  return allowlist.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).some(s => s.startsWith("@") ? address.endsWith(s) : address === s);
}
export function validateReceiptDownloadUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || !(parsed.hostname.endsWith(".resend.com") || parsed.hostname.endsWith(".cloudfront.net"))) throw new Error("Unexpected attachment host");
  return parsed;
}
