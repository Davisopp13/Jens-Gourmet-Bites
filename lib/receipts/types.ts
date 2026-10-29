import { z } from "zod";

export const units = ["cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "count"] as const;
const cents = z.number().int().min(0).max(100_000_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid purchase date").refine(v => !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use a valid purchase date");
export const receiptLineSchema = z.object({
  id: z.string().uuid(), description: z.string().trim().min(1).max(300),
  quantity: z.number().finite().positive().max(10000), net_cents: cents,
  package_quantity: z.number().finite().positive().max(100000).nullable(),
  unit: z.enum(units).nullable(), ingredient_id: z.string().uuid().nullable(),
  exact_product: z.string().max(300), confirmed: z.boolean(), use_for_pricing: z.boolean(),
  category: z.enum(["ingredient", "supply", "personal", "other"]), on_sale: z.boolean(),
});
export const receiptReviewSchema = z.object({
  store: z.string().trim().min(1).max(150), location: z.string().max(300), purchased_on: date,
  total_cents: cents, tax_cents: cents, adjustment_cents: z.number().int().min(-100_000_000).max(100_000_000),
  adjustment_note: z.string().max(500), notes: z.string().max(2000),
  lines: z.array(receiptLineSchema).max(150),
});
export type ReceiptLine = z.infer<typeof receiptLineSchema>;
export type ReceiptReview = z.infer<typeof receiptReviewSchema>;
export interface ReceiptFile { path: string; name: string; type: string; size: number; sha256: string }
export interface ReceiptRecord {
  id: string; owner_id: string; source: "upload" | "email"; source_id: string | null;
  subject: string | null; sender: string | null; status: "pending" | "archived" | "reviewed";
  extraction_status: "manual" | "ready" | "failed" | "processing";
  extraction_message: string | null; extraction_attempts: number;
  files: ReceiptFile[]; data: ReceiptReview; raw_text: string | null;
  version: number; created_at: string; reviewed_at: string | null;
  fingerprint: string; applied_prices: { ingredient_id: string; name: string; old_cents: number; new_cents: number }[];
}
export const blankReview = (): ReceiptReview => ({ store: "", location: "", purchased_on: "", total_cents: 0, tax_cents: 0, adjustment_cents: 0, adjustment_note: "", notes: "", lines: [] });
export function reconcile(data: ReceiptReview) { return data.lines.reduce((sum, line) => sum + line.net_cents, 0) + data.tax_cents + data.adjustment_cents - data.total_cents; }
export function validateReview(data: unknown, apply: boolean): ReceiptReview {
  const parsed = receiptReviewSchema.parse(data);
  if (parsed.adjustment_cents && !parsed.adjustment_note.trim()) throw new Error("Describe the receipt-level adjustment.");
  if (apply) {
    if (reconcile(parsed) !== 0) throw new Error("Line amounts, tax and adjustments must match the receipt total.");
    const selected = parsed.lines.filter(l => l.use_for_pricing);
    if (!selected.length) throw new Error("Select at least one ingredient cost to update.");
    if (parsed.adjustment_cents !== 0) throw new Error("Allocate receipt-level discounts or fees to the line amounts before updating ingredient costs.");
    if (new Set(selected.map(l => l.ingredient_id)).size !== selected.length) throw new Error("Combine repeated ingredient purchases into one line before updating that ingredient.");
    for (const line of selected) {
      if (line.category !== "ingredient" || !line.confirmed || !line.ingredient_id || !line.unit || !line.package_quantity || !line.exact_product.trim()) throw new Error("Confirm each selected product, package size and ingredient match.");
    }
  }
  return parsed;
}
export function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
