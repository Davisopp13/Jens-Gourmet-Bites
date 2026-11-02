import { randomUUID } from "node:crypto";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowedAdminIds } from "./types";
import { pushEndpointAllowed } from "./validation";

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};
export async function sendPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; url: string; tag: string },
) {
  if (!pushEndpointAllowed(subscription.endpoint))
    throw new Error("invalid_subscription");
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  )
    throw new Error("push_not_configured");
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    vapidDetails: {
      subject: "mailto:jensgourmetbites@gmail.com",
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    },
    TTL: 3600,
    timeout: 8000,
  });
}
const escapeHtml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function inquiryEmail(inquiry: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferred_format: string | null;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://jensgourmetbites.com"}/admin/inquiries/${inquiry.id}`;
  const format =
    (
      {
        frozen: "Frozen Dough",
        baked: "Fresh Baked",
        either: "Either is fine",
      } as Record<string, string>
    )[inquiry.preferred_format ?? ""] ?? "Not specified";
  const text = `New Order Inquiry\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || "Not provided"}\nPreferred format: ${format}\n\n${inquiry.message}\n\nOpen inquiry: ${url}`;
  return {
    from:
      process.env.CONTACT_FROM_EMAIL ||
      "Jen's Gourmet Bites <orders@jensgourmetbites.com>",
    to: process.env.CONTACT_EMAIL || "jensgourmetbites@gmail.com",
    reply_to: inquiry.email,
    subject: `New Order Inquiry from ${inquiry.name}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="color:#146C68">New Order Inquiry</h2><p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p><p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p><p><strong>Phone:</strong> ${escapeHtml(inquiry.phone || "Not provided")}</p><p><strong>Preferred format:</strong> ${format}</p><p style="white-space:pre-wrap;background:#FFF7ED;padding:16px">${escapeHtml(inquiry.message)}</p><a href="${escapeHtml(url)}">Open inquiry in admin</a></div>`,
  };
}
// The lease is a database compare-and-set; two requests cannot send the same active job.
export async function deliverNotifications(
  inquiryId: string,
  pushSender = sendPush,
) {
  const db = createAdminClient();
  const token = randomUUID();
  const { data: jobs, error: claimError } = await db.rpc(
    "claim_inquiry_notifications",
    { p_id: inquiryId, p_token: token },
  );
  if (claimError) throw claimError;
  if (!jobs?.length) return;
  const { data: inquiry, error } = await db
    .from("contact_submissions")
    .select("id,name,email,phone,message,preferred_format")
    .eq("id", inquiryId)
    .single();
  if (error) throw error;
  await Promise.all(
    jobs.map(
      async (job: {
        id: string;
        channel: string;
        subscription_id: string | null;
      }) => {
        let state = "accepted";
        let last_error: string | null = null;
        let provider_id: string | null = null;
        try {
          if (job.channel === "email") {
            if (!process.env.RESEND_API_KEY)
              throw new Error("email_not_configured");
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              signal: AbortSignal.timeout(8000),
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `inquiry/${job.id}`,
              },
              body: JSON.stringify(inquiryEmail(inquiry)),
            });
            const result = await response.json();
            if (!response.ok || !result.id)
              throw new Error("email_provider_rejected");
            provider_id = result.id;
          } else {
            const { data: sub, error: subError } = await db
              .from("inquiry_push_subscriptions")
              .select("id,user_id,endpoint,keys")
              .eq("id", job.subscription_id ?? "")
              .maybeSingle();
            if (subError) throw subError;
            if (!sub || !allowedAdminIds().includes(sub.user_id))
              throw new Error("device_unavailable");
            try {
              await pushSender(sub, {
                title: "Jen’s Gourmet Bites",
                body: "A new inquiry is waiting. Tap to open it.",
                url: `/admin/inquiries/${inquiryId}`,
                tag: `inquiry-${inquiryId}`,
              });
            } catch (e) {
              if (
                [404, 410].includes(
                  (e as { statusCode?: number }).statusCode ?? 0,
                )
              ) {
                const { error: deleteError } = await db
                  .from("inquiry_push_subscriptions")
                  .delete()
                  .eq("id", sub.id);
                if (deleteError)
                  console.error("Expired push subscription cleanup failed");
                throw new Error("device_expired");
              }
              throw e;
            }
          }
        } catch (e) {
          state = "failed";
          const known = [
            "email_not_configured",
            "push_not_configured",
            "device_unavailable",
            "device_expired",
            "email_provider_rejected",
          ];
          last_error = known.includes((e as Error).message)
            ? (e as Error).message
            : "delivery_failed";
        }
        const { error: saveError } = await db
          .from("inquiry_notifications")
          .update({
            state,
            last_error,
            provider_id,
            leased_until: null,
            lease_token: null,
          })
          .eq("id", job.id)
          .eq("lease_token", token);
        if (saveError)
          console.error(
            "Notification result persistence failed",
            saveError.code,
          );
      },
    ),
  );
}
