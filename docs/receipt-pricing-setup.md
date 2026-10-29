# Receipt pricing implementation — October 28, 2026

## Current scope — upload first

Davis deferred emailed receipts. The visible pricing tool now focuses on upload → review → archive/approve. The Receipts tab has no inbox setup card or email configuration dependency. Email code is parked and unconfigured; provider/domain setup and email delivery testing are out of the current scope. Do not resume that work unless Davis asks.

## Current state

Option 1 (Pricing Workbench) is implemented in the existing Next.js admin app. The local preview is `http://localhost:3000/admin/pricing`. Application changes are uncommitted and not deployed to the public website.

The additive migration `supabase/migrations/20261028215008_receipt_archive.sql` was applied through the signed-in SQL editor to Jen’s existing Supabase project `hdbtxiyvrkuzhwgrffip`. The `receipts` and `pricing_drafts` tables and private `receipts` storage bucket were verified through the app connection. Existing recipes, ingredients and storefront prices were not changed. Do not reapply this migration blindly; its tables/function already exist in this project. A fresh environment first needs the existing pricing tables from `supabase/pricing_migration.sql`.

The email ingestion route is implemented but **not connected**. No receiving domain, DNS records, provider webhook or mailbox has been provisioned. Resend is signed out in the browser and `RESEND_API_KEY` is empty. Automatic receipt reading is **connected in the local app** after Davis supplied the key. Both the live API check and signed-in upload/extraction flow passed using the synthetic PDF. The key remains server-only in ignored `.env.local`. No deployment environment was configured; email setup has been removed from the current workflow. Manual upload, review, archive, search, original downloads and CSV export work without either provider.

## Everyday workflow

1. Open Pricing → Receipts. Upload up to five JPG, PNG, WebP or PDF files, at most 3 MB combined. Multiple files represent one purchase.
2. Originals are stored privately before any reading attempt. When configured, OpenAI suggests store/date/items; otherwise enter details manually.
3. Enter each receipt line, including personal items, quantity purchased and the net line total after item discounts. Categorize personal/supply items separately. Review discounts, tax and receipt total.
4. For selected ingredient costs, choose the inventory ingredient and confirm exact brand/variety, package quantity and compatible unit. King Arthur flour and Land O Lakes butter still need Jen’s actual variety/size; the app does not substitute a generic or competing brand.
5. **Save receipt only** archives a purchase without modifying costs. It may later be reviewed for cost updates. **Save + update selected costs** requires confirmed items and reconciled totals. Receipt-wide adjustments must first be allocated to lines. Sale items can remain archived without being selected for pricing.
6. Approval records old/new prices and the source receipt atomically. Older purchases cannot replace newer receipt-verified costs. Approved records are immutable. Manual ingredient changes clear prior receipt verification; the old web scraper skips receipt-verified prices.
7. Search the archive by store/date/item text, download originals or export receipt metadata CSV. Approved costs have a source-receipt link under Ingredients.

Costs are normalized to the inventory package unit/quantity, so a 5 lb purchase can update an inventory record defined per 1 lb. Weight and volume are never converted without a known density; an incompatible recipe must be corrected explicitly. Net ingredient costs exclude tax. This is a pricing archive, not a complete accounting ledger.

The workbench calculates whole recipe batches, selling packs and leftovers. Packaging is per selling pack; labor is active minutes × hourly rate; overhead and waste are per-order amounts. Target margin uses cost / (1 − margin). Payment fees, delivery and sales tax are excluded and labeled. Save requires reviewing all costs, including zeros. Saved estimates retain immutable recipe/cost snapshots and do not change storefront prices. The real database currently has no recipes; setup is required before a real estimate can be saved.

## Deferred: connect the dedicated receiving address

Davis selected an address on Jen’s domain. The observed site domain is `jensgourmetbites.com`; proposed address: **receipts@inbox.jensgourmetbites.com**. This is a receiving address feeding the app, not an interactive personal mailbox. Do not tell Jen to send receipts until activation and a real delivery test succeed.

1. Sign into the intended Resend account. Add `inbox.jensgourmetbites.com`, configure receiving and verify the exact DNS records Resend supplies. Keep existing root-domain MX records intact. Use the receiving MX shown in that account; do not guess regional values. Receiving-only domains still require the provider’s verification/DKIM record. [Official receiving-domain guide](https://resend.com/docs/dashboard/receiving/custom-domains).
2. Add server-only deployment environment values (never NEXT_PUBLIC):
   - `RESEND_API_KEY`: key with permission to retrieve received messages and attachments.
   - `RESEND_RECEIPT_WEBHOOK_SECRET`: signing secret for this receiving webhook.
   - `RECEIPT_INBOX_ADDRESS=receipts@inbox.jensgourmetbites.com`
   - `RECEIPT_INBOX_OWNER_ID`: Supabase auth UUID for Jen’s existing admin account, not her email address.
   - `RECEIPT_ALLOWED_SENDERS`: comma-separated exact forwarding addresses or explicitly trusted `@domain` entries. Start with Jen’s forwarding address; verify real retailer senders before adding them.
3. Deploy the reviewed application, then subscribe a Resend webhook to `email.received` at `https://jensgourmetbites.com/api/receipts/email`. A localhost URL cannot receive provider webhooks. No production deployment was performed in this task.
4. Verify one forwarded itemized email and one attachment receipt. Confirm the original, sender/date, extracted details, private archive ownership, duplicate-event retry, rejected unrelated recipient/sender, and archive-only behavior. Check provider webhook failures/retries.
5. For automatic reading, configure server-only `OPENAI_API_KEY` and optionally `RECEIPT_EXTRACTION_MODEL` (default `gpt-4.1-mini`). It sends receipt media/text to the OpenAI Responses API with `store:false`; this setting is not a blanket zero-retention guarantee. Original storage remains Supabase. Test a real receipt, poor photo, multiline discount and multipack purchase before relying on extraction.

Secrets must be entered through local/deployment environment settings, not pasted into chat or committed. `.env.local.example` lists the settings.

## Email behavior and boundaries

- Verify the raw webhook signature/timestamp before fetching data; only the configured recipient and allowlisted sender are ingested. The allowlist is not independent proof of a sender’s identity; extracted content remains untrusted and cannot change costs automatically.
- Fetch the actual message and attachments through Resend. Preserve raw `.eml` when available, otherwise original message metadata/body as a text file. HTML is never rendered or followed; plain text is used for review.
- Supported image/PDF attachments: up to five and 3 MB combined. Raw original email: up to 6 MB. Downloads require approved HTTPS provider/CDN hosts and reject redirects. Unsupported file types are not extracted; originals remain in raw message when available. Oversized messages fail delivery processing and require provider/operator follow-up.
- Incoming emails become pending records. Automatic reading starts when the owner opens a new email receipt, not inside the delivery webhook. Link-only receipts require a manual upload of the actual itemized receipt; the app does not visit embedded links.
- Exact upload-content sets and provider email IDs are deduplicated. Email fingerprints include the original message so shared inline logos cannot discard separate purchases. A photo taken again or the same purchase forwarded under a new message ID can create a second review record; semantic/cross-channel purchase deduplication is not claimed.
- Per-owner limit: 100 accepted email receipts/day. Signed retries are idempotent and errors return non-success for provider retry. Provider delivery monitoring is still part of activation.
- Private owner read access on receipt/draft rows; all writes use authenticated server routes. Original download links expire after 60 seconds. Email receipts belong to the configured admin owner; another login cannot read that archive. Existing shared recipe/ingredient authorization is unchanged.
- Concurrent receipt edits use version checks; cost updates/history/archive state commit in one database transaction. A process crash during file ingestion may leave unreferenced storage objects; there is no scheduled cleanup yet. A reader interrupted mid-request may remain processing; manual entry is still available. Maximum three automatic reading attempts per pending receipt.
- No automatic deletion or retention schedule. No outbound mail is sent by this feature.

## Verification and handoff

- `npm run test:receipts`: unit validation/calculation/security cases plus an isolated native PostgreSQL migration/RLS/atomic review integration test. The SQL test creates and removes a temporary cluster, not a production database. It needs local PostgreSQL binaries.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Browser exercised authenticated upload, date validation, archive-only save/reopen, item search, exact duplicate upload, CSV export and private PDF download. Downloaded PDF SHA-256 matches the original fixture. Unauthenticated API returns 401; unconfigured email intake returns 503.
- Synthetic verification fixture is `output/receipt-build-2026-10-28/test-receipt.pdf`. No test ingredient prices were approved. Test cloud record/files are removed after evidence capture.
- Visual evidence and responsive findings are recorded in project-root `design-qa.md`.
- Current remaining acceptance: review one real uploaded receipt, configure/test automatic reading if desired, enter real recipes, and deploy the reviewed application. Email activation is deferred and is not an upload-release requirement. No public site release or actual mailbox delivery is claimed.

Final verification: all 17 tests passed; lint passed; standalone TypeScript checking passed; production build passed. Production-mode local preview (`npm run start -- --hostname 127.0.0.1`) is running on port 3000. Final browser capture `output/receipt-build-2026-10-28/receipt-tool-final.png` shows the empty archive after test cleanup and pending inbox/reader setup; browser error/warning log was empty. `git diff --check` passed. Existing dependency audit findings were not remediated as part of this feature; review the repository’s dependency/security baseline before release.


## Previous automatic-reading connection checkpoint

Davis requested activating automatic reading for uploads. The project/process has no `OPENAI_API_KEY`; a blank server-only setting is ready in ignored `.env.local`. API-key setup page was opened for user entry. No credentials were copied from another project or account.

The same extraction core now serves the application and `npm run check:receipt-reader`. That command sends only the synthetic PDF fixture, checks the extracted date/item/$6.49 total, and asserts that no item is confirmed or selected for pricing. It writes no business records. The check exits 2 with a clear setup message when the key is missing; it has **not passed a live API extraction yet**.

Provider failures now distinguish rejected keys, model permissions/unavailability and usage/billing limits without exposing provider response bodies. Four extraction tests cover safe field population, malformed/unknown amounts, connection errors and image/PDF request structure. All 21 receipt tests, lint and TypeScript checks pass. Next: user saves the key, run the live check, restart the app, exercise a synthetic upload through the signed-in UI, then test Jen’s actual receipt. Email remains deferred.

The activation-preparation production build also passed, and the local production preview was restarted. No API key has been supplied or live reading claimed at this checkpoint.


## Automatic reader connected — October 28, 2026

Davis supplied the API key in `.env.local`. `npm run check:receipt-reader` passed a real OpenAI request, correctly reading the synthetic date, item and $6.49 total. The local production-mode server was restarted with the credential. Browser upload then independently saved the original, automatically called extraction, and populated Test store, 2026-10-28, one Sample flour package, $6.49 item/total and $0 tax. The difference to resolve was $0.00; cost-approval remained disabled because no ingredient was confirmed or selected. No ingredient prices changed.

Evidence: `output/receipt-build-2026-10-28/automatic-reading-verified.png` and `automatic-reading-verification.json`. Synthetic database record and private original were removed after verification. No browser error/warning entries were reported. The current code's 21 tests/lint/types/production build already passed; this turn additionally verified the live credential and full upload flow without source changes.

Status: **local upload reading active; public-site deployment still pending**. Jen can now test a real upload in the local preview. Real receipts still need human review for faint text, discounts and exact product/package matching. The same server-only credential must be configured in the eventual hosting environment when the reviewed application is deployed. Email remains deferred.


## Production activation — October 28, 2026

See `docs/receipt-release-2026-10-28.md` for the current release. Production OpenAI and receipt admin allowlist secrets are configured. `RECEIPT_ADMIN_USER_IDS` is now required in all environments and contains the existing confirmed Jen and Davis account IDs. Email remains deferred; its HTTP endpoint is excluded from the release. The additive migration has already been applied; do not rerun it on production.
