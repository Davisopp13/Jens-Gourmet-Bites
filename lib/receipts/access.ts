export function isReceiptAdmin(userId: string, allowlist: string | undefined): boolean {
  return (allowlist ?? "").split(",").map(id => id.trim()).filter(Boolean).includes(userId);
}
