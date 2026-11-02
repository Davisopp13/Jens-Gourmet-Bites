import { z } from "zod";
export const contactSchema = z.object({
  submission_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254),
  phone: z.string().max(100).nullish(),
  message: z.string().trim().min(1).max(10000),
  preferred_format: z.enum(["frozen", "baked", "either", ""]).nullish(),
});
// Permit only established push services, preventing arbitrary server-side fetch targets.
export function pushEndpointAllowed(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      (u.hostname === "fcm.googleapis.com" ||
        u.hostname === "updates.push.services.mozilla.com" ||
        u.hostname === "web.push.apple.com" ||
        u.hostname.endsWith(".push.apple.com"))
    );
  } catch {
    return false;
  }
}
export const subscriptionSchema = z
  .object({
    endpoint: z
      .string()
      .max(3000)
      .refine(pushEndpointAllowed, "Unsupported push service"),
    keys: z
      .object({
        p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),
        auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
      })
      .strict(),
  })
  .strict();
export const editSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("status"),
      status: z.enum(["new", "in_progress", "done"]),
      version: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal("note"),
      note: z.string().trim().min(1).max(5000),
      version: z.number().int().positive(),
    })
    .strict(),
]);
