# Admin invitation redirect — November 5, 2026

## Evidence and fix

Supabase project `hdbtxiyvrkuzhwgrffip` still had Site URL `http://localhost:3000` and no redirect allowlist. The dashboard invitation for Davis's new account was confirmed before the browser reached localhost. No invitation/password-setup route existed in the production app. The browser client uses PKCE, whereas dashboard invitations/recovery emails return implicit tokens; the installed SDK rejects automatic implicit parsing in a PKCE client.

`/auth/setup` explicitly accepts dashboard token fragments and browser PKCE codes using a dedicated browser client with automatic URL detection disabled. It verifies the user with Auth, removes URL credentials, displays the target email, and lets the user set and confirm their own password. It rejects failed/expired links before considering any existing session and rechecks the account before updating a password. The route does not grant admin permissions. Login now offers “Set or reset your password,” with a generic email response.

## Hosted configuration

The intended Supabase Site URL is `https://jensgourmetbites.com/auth/setup`. Using the setup path as the default sends dashboard invitations and recovery emails directly to password setup; the public homepage stays at `/`. The exact same setup URL should be in the redirect allowlist for explicit browser reset requests. No wildcard preview destinations are needed.

Vercel receipt and inquiry admin allowlists need Jen's existing account and Davis's newly invited account. Website content uses the receipt allowlist as its fallback. Reconcile the stale Davis account reference without changing database policies, permitting public signup, or altering Jen's account.

## Verification and remaining work

Six focused tests cover implicit invitations, PKCE recovery, failed exchanges, incomplete tokens, expired links with an existing session, server verification, and password matching. Lint, TypeScript and production build passed. Browser verification showed the expired-link message and cleared URL credentials. No real password was set by the agent and no email was sent during preparation.

Prepared in `/Users/davis/.codex/worktrees/jens-admin-invite` on `codex/admin-invite-redirect` from `d348f29`. The original dirty redesign checkout is preserved. Release/configuration verification is recorded in the task checkpoint after deployment. The user must request a fresh password email and personally enter/submit their password. Old consumed invitation links cannot be reused.

References: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/reference/javascript/auth-setsession.
