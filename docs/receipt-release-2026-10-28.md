# Receipt pricing release — October 28, 2026

## Scope and source

Davis authorized deploying receipt upload, automatic reading and archive on the existing live site. Email ingestion remains deferred and its endpoint is excluded from this release. The separate palette release went live during preparation; this release is based on its merge revision and preserves the deployed theme.

Production project: Vercel `jens-gourmet-bites` (`prj_V9smC7Y1Vo6cSCbPdoruPVRr896U`) in `davisopp13s-projects`; domain https://jensgourmetbites.com.

Release built from the verified previous production Git revision `df5f02e2036df3a315dbd4998d50737218bcfbc8`, overlaid with pricing/receipt files. The initial pre-palette candidate file manifest and source archive are in `output/receipt-build-2026-10-28/release-manifest.json` and `receipt-release-source.tar.gz`. Archive SHA-256: `a6bdda5ffdc6386d58771c7ce2f2f91d7d40dd2c98d6b29a0e09373f2581b0d2`. No secrets, duplicate files, tests or email endpoint are uploaded. The final authoritative source will be the release commit. Source staging directory: `/tmp/jens-receipt-release-20261028`.

Existing dirty main is preserved. The release is prepared on isolated `codex/receipt-upload-release` from current `origin/main` and will be integrated through a pull request, so future Git deployments retain the receipt tool.

## Release preparation

- Next upgraded from 14.2.35 to security-patched 15.5.28; React/DOM and types upgraded to 19, Zod to 4.6.7. Compatible dependency security updates applied. Next's PostCSS dependency overridden to 8.5.32; npm audit reports zero vulnerabilities.
- Receipt dynamic route params made asynchronous for Next 15. CSV export is explicitly a download.
- New receipt/pricing server helper requires `RECEIPT_ADMIN_USER_IDS`. Production and local config allow Jen's existing confirmed admin account and Davis's existing confirmed admin account. Unknown/new signup accounts fail closed. This does not change the pre-existing product/recipe/ingredient authorization model.
- Production Supabase URL, anon key and service role match local configuration for `hdbtxiyvrkuzhwgrffip`; receipt migration/private bucket already exist and were not reapplied.
- `OPENAI_API_KEY` and `RECEIPT_ADMIN_USER_IDS` added as sensitive production Vercel environment variables through stdin. No values recorded here. Default extraction model remains `gpt-4.1-mini`.
- 22 tests pass, including actual isolated PostgreSQL/RLS/atomic review, extraction, money/unit semantics and the new admin restriction. Lint, TypeScript and isolated production build pass.

## Deployment and rollback

Candidate: https://jens-gourmet-bites-hut5isenj-davisopp13s-projects.vercel.app (initial candidate passed its build; never promoted to the custom domain because a separate palette release completed concurrently).

Previous production / rollback target: `dpl_5NDybibAwqaPVCe2LjVhrq4as8Ss`, https://jens-gourmet-bites-9jhw155fk-davisopp13s-projects.vercel.app. Rollback via Vercel promotion does not undo additive receipt tables or remove stored receipts. The previous app does not have receipt UI.

Live verification and final promotion status will be recorded below.

Local build note: Next 15’s generated static favicon loader fails when the checkout path contains an apostrophe. The identical source builds in `/tmp/jens-receipt-release-20261028` and on Vercel; use a checkout path without apostrophes for production builds. No favicon content was changed by this release.
