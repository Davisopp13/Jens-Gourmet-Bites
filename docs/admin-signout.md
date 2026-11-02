# Admin sign-out after inquiry access is revoked

Developed on `codex/signout-cleanup`, based on verified GitHub `main` at
`23f495271c2df793c4a2f94b3141d7343a310718` (PR #6). After local review, the user
authorized committing, pushing and merging the fix on November 2, 2026. This
change needs no database migration or production configuration update.
Concurrent PR #7 was integrated from `3d1612bb37a3579a51b609076f59e23604c2b3a2`;
its new mobile navigation had a second cleanup-blocking sign-out handler, which
now shares the same implementation as the desktop header.

## Problem and resulting behavior

[PR #4 review](https://github.com/Davisopp13/Jens-Gourmet-Bites/pull/4#discussion_r4448341884)
identified this sequence: a subscribed owner loses inquiry allowlist access;
push DELETE returns 403; browser unsubscribe never runs; the header returns
before calling Supabase sign-out. The existing builder, **Add inquiry queue
with alerts**, confirmed the issue and reported no existing fix or conflicting
work. Its checkout and the concurrent redesign work at `664562f` were preserved.

- Push DELETE now requires a verified, non-anonymous session and a same-origin
  request, but does not require current inquiry access. Its database deletion
  still filters by both endpoint and the verified user's ID. A former owner can
  remove only their own subscription. Inquiry reads and push GET/POST retain
  the existing allowlist authorization; table grants and RLS are unchanged.
- Browser unsubscribe and server removal run independently. An eight-second
  deadline covers subscription lookup and cleanup; it aborts an outstanding
  DELETE. Failure or timeout cannot prevent an attempt to sign out.
- A shared hook checks Supabase's returned error, disables both desktop/mobile sign-out controls
  while busy, and replaces the current page with login only after sign-out
  succeeds. If notification cleanup could not be confirmed, it warns the user
  and gives the device-settings fallback. An actual auth failure stays visible
  and permits retry. The existing Supabase sign-out scope is preserved.

## Validation

- `npm run test:inquiries`: 23/23 passed, including 15 new sign-out regressions.
- `npm run test:receipts`: 22/22 passed.
- `npm run lint`: passed with no ESLint warnings or errors.
- `node_modules/.bin/tsc --noEmit`: passed.
- `npm run build`: passed using synthetic Supabase settings. The sandboxed
  attempt could not resolve Google Fonts; the network-enabled local build
  succeeded. Next's existing multiple-lockfile/workspace-root warning remains.
- `git diff --check`: passed.
- The two selected browser-cleanup/revoked-owner tests fail against the
  original source at the base revision, and pass with the fix.

The new tests execute the actual route, authorization helper, push cleanup,
and desktop/mobile event handlers with synthetic sessions/browser boundaries.
The real Supabase query builder verifies endpoint/user ownership filters;
existing database tests use isolated temporary native PostgreSQL clusters.
Coverage includes desktop/mobile revoked/normal sign-out, other-user isolation, invalid and
anonymous sessions, cross-origin requests, API 403/503/offline/malformed responses,
unsubscribe rejection/false results, stalled operations, unsupported devices,
and returned/thrown auth errors. No real subscription, user session or remote
database was used. Physical iPhone/Safari and live sign-out remain unverified.

## Review location and handoff

Checkout: `/Users/davis/Documents/Codex/2026-11-02/task/jens-signout-fix`.
Changes: six production source files, the inquiry test command, one new
regression test file, and this note. Dependency/lockfile contents are unchanged;
`node_modules` points to the existing inquiry checkout whose lockfile matches.
Review artifacts are in the sibling `review-evidence` directory.

Instructions read: `/Users/davis/.codex/AGENTS.md`, workflow-kit `PROJECTS.md`
and `SKILL-CATALOG.md`, repository README and inquiry-queue documentation, and
the Supabase skill. No repository AGENTS.md or .agents/skills was present.
Current Supabase sign-out docs and changelog were checked; no relevant SDK
change was required. Auth/security review confirmed verified user identity,
same-origin writes, ownership filtering, unchanged inquiry authorization,
unchanged RLS/grants, and no new client credentials.

After merging, verify GitHub checks and the production deployment against the
exact merge revision; retain the release receipt with the local review evidence.
Then complete physical-device sign-out verification with an intended test
account/device. The shared workflow-kit row is outside this task's writable
roots, so its optional update was not attempted.
