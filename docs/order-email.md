# Order inquiry email

The public Place an Order form posts to `/api/contact`. It saves to the existing `contact_submissions` table and sends a notification through Resend.

- Recipient: `jensgourmetbites@gmail.com` (`CONTACT_EMAIL`).
- Sender: `Jen's Gourmet Bites <orders@jensgourmetbites.com>` (`CONTACT_FROM_EMAIL`). This is an outbound identity, not a new inbox.
- Reply-To: the customer's submitted address, so Jen can reply to the customer directly.
- `RESEND_API_KEY` is server-only and restricted to sending for `jensgourmetbites.com`. Store it only in protected host settings or an ignored local environment file.
- The endpoint reports success only after Resend accepts the email and returns an ID. Provider rejection or missing setup gives an actionable error with Jen's direct email. Acceptance is distinct from final inbox delivery.
- A database insert failure still attempts the email, preserving the existing fallback. A rejected notification may leave a saved inquiry; there is no automatic retry queue.
- Submitted values are length/type checked and HTML-escaped in the email. The recipient is server-configured, never supplied by a visitor.

## Domain setup — November 2, 2026

Resend domain `7508d6e0-290a-4df0-9572-28d2a2465724` is verified in the existing `davisopp` account. Vercel manages DNS. Added the provider's DKIM TXT at `resend._domainkey`, CNAMEs at `rsend` and `send`, plus monitoring-only DMARC at `_dmarc`. Existing website records were preserved. Receiving is disabled; receipt email intake remains deferred.

Official setup references: https://resend.com/docs/send-with-nextjs and https://resend.com/docs/dashboard/domains/introduction.

## Validation and release

`npm run test:contact` checks the actual endpoint with intercepted database/provider HTTP calls: branded routing and reply address, HTML escaping, provider rejection/network failure/missing ID, absent key, database failure fallback and invalid input. These checks send no real emails and touch no database.

Four contact endpoint test groups, lint, standalone TypeScript and production build pass. Release and live delivery evidence will be recorded after configuration and verification. Worktree: `/Users/davis/.codex/worktrees/jens-order-email`, branch `codex/order-email`, based on production `0d3334b`. The original dirty checkout remains preserved.


Production `RESEND_API_KEY` (sensitive), `CONTACT_EMAIL` and `CONTACT_FROM_EMAIL` were configured after Davis approved the restricted key. Active key ID: `11f26987-e155-434e-a938-5f5e311df716`, sending-only for Jen's domain. The initial unused key was revoked before activation after the dashboard exposed its value in a tool result. No key value is recorded in source or documentation; the protected transfer file was removed.

Rollback app deployment: `dpl_34GDW4FVLoPTQEdFbfoX68FP8yRE` (previous production `0d3334b`). Configuration can be removed independently. No schema migration is required.

Workflow kit read: `PROJECTS.md`, `SKILL-CATALOG.md` and `prompts/DAILY-PROMPTS.md` under `/Users/davis/ai-workflow-kit`.
