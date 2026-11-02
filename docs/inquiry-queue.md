# Inquiry queue and admin push alerts

The public form saves an inquiry before attempting notifications. The owner inbox is `/admin/inquiries`; individual links use `/admin/inquiries/<uuid>`. Jen and Davis can work through New → In progress → Done, reopen an inquiry, and append private notes. Status changes and notes retain the actor and timestamp. Existing submissions remain in History until an admin explicitly moves them to New; that move sends no notifications.

## Operation

- Open inquiries are newest first. Filters include New, In progress, Done, and History. Lists use 50-row pages. The queue, detail and navigation count refresh every 30 seconds while visible and when returning to the app.
- Email and telephone links open the device's own apps. No automatic customer reply, payment, or fulfillment workflow is added.
- Customer success means the inquiry was saved. A database failure preserves the form and offers retry/direct email. Email and push failures do not discard a saved inquiry or ask the customer to resubmit.
- The client retains a submission UUID while retrying unchanged form data. The database atomically saves the inquiry plus notification jobs; duplicate UUIDs return the existing inquiry and cannot insert duplicate jobs. Reusing a UUID for changed data returns 409. Older open clients without UUIDs remain compatible, but cannot deduplicate requests across retries.
- Jobs track pending, accepted, or failed separately for email and each subscribed device. A 60-second database lease prevents concurrent attempts of the same job. Initial requests attempt both channels with 8-second provider timeouts. Admin **Retry notification** attempts only pending/failed jobs; a still-active lease must expire first. There is no background retry worker.
- Email retains the existing `CONTACT_EMAIL`, `CONTACT_FROM_EMAIL`, `RESEND_API_KEY`, and customer Reply-To. Links use `NEXT_PUBLIC_SITE_URL` (default `https://jensgourmetbites.com`). Resend idempotency keys are stable per notification job. Provider acceptance is distinct from delivery/read confirmation. Resend's deduplication window is 24 hours; an ambiguous result retried beyond that window may deliver again.
- Push alerts are generic and contain no customer details. They occur only on new website inquiries and target devices subscribed at creation time. Status changes, notes, historical imports and later subscriptions do not generate new-inquiry alerts. Missing devices are explained in the inquiry detail.

## Configuration and access

`INQUIRY_ADMIN_USER_IDS` is the comma-separated owner UUID allowlist; if absent it uses `RECEIPT_ADMIN_USER_IDS`. An explicit empty value fails closed. Routes verify the session with Supabase `getUser`, reject anonymous/unlisted accounts, and check same-origin writes. Inquiry, activity, subscription and job tables use RLS with no public/browser-role grants. Only the server service role accesses them after route authorization. RPCs are invoker functions with an empty search path and execute privileges limited to the service role.

Use a stable VAPID pair: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and server-only `VAPID_PRIVATE_KEY`. The pair is stored in ignored local configuration and protected Vercel production settings; never place the private key or device endpoints in source, client payloads, or logs. Vercel's downloaded production env files redact sensitive values; those placeholders are not usable credentials or allowlists.

The additive migration is `supabase/migrations/20261102215528_inquiry_queue.sql`. It preserves old records. Its production application used the Supabase SQL editor because the connector denied SQL access and CLI direct access lacked IPv6 connectivity. No Supabase migration-history schema existed; the canonical SQL file and release evidence document the application. Do not blindly reapply this migration to the already-upgraded database. App rollback can retain the schema: the previous public handler uses the service role and remains compatible. Public inquiry grants must remain revoked.

The admin worker is explicitly selected instead of the separate public worker. It caches only the generic offline page, activates its update, receives push and opens/focuses only internal inquiry links. Signed-out links retain a validated inquiry return path through login. Subscription records belong to an admin/device, accept only recognized HTTPS push services, and are removed on disable/sign-out or provider 404/410 responses. New deliveries recheck the current owner allowlist. Each owner can register up to ten devices. Revoking an owner in configuration prevents further inquiry reads and new deliveries; messages already accepted by a push provider may still arrive.

## iPhone setup

On iOS/iPadOS 16.4 or later, open `https://jensgourmetbites.com/admin` in Safari, use Share → Add to Home Screen, then open the installed app, sign in, choose Inquiries → Enable notifications, and allow the prompt. Use Send test notification. Permission must originate from the button tap. Blocked permission requires changing device notification settings and reopening the app. Push can arrive while the app is in the background, subject to device connectivity, notification settings and Focus.

Official references: [Apple Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Validation

- `npm run test:inquiries`: endpoint/provider isolation, independent channel failures, branded/escaped email and stable idempotency keys, access helpers, return-path and subscription validation; isolated native PostgreSQL migration/history, concurrent duplicates, atomic rollback, status/notes, optimistic concurrency, leases and role restrictions; worker activation, generic notifications, safe links and private-data cache isolation.
- `npm run test:receipts`: 22 existing receipt/pricing regressions.
- Lint, standalone TypeScript, production build, worker syntax and `npm audit --omit=dev` passed. Production dependency audit reported zero vulnerabilities; development tooling has 18 moderate findings outside this feature.
- Browser verification exercised authenticated queue and details, private note persistence, status progression/reopen, new-count changes and no horizontal overflow at 390px/320px with 44px+ controls. Unauthenticated inquiry/push endpoints returned 401. Real Chrome push subscription, test alert and new-inquiry alert were received and inspected using the browser's notification API. A missing local email credential produced a saved inquiry with a retryable email failure, independently of accepted push.
- Physical iPhone and live release results are recorded separately in `output/inquiries-2026-11-02/` and the project handoff. Synthetic test data is labeled; no real orders or ingredient prices were changed.

Workflow kit read: `/Users/davis/ai-workflow-kit/PROJECTS.md` and `SKILL-CATALOG.md`. Supabase skill applied. The original dirty redesign checkout is preserved; this feature is isolated in `/Users/davis/.codex/worktrees/jens-inquiries` on `codex/admin-inquiries`.
