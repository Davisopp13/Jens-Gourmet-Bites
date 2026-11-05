import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invalidSetupLink, passwordValidation, verifyPasswordSession } from "../lib/auth/password-setup";

function fixture({ session = true, verified = true, sessionError = false, exchangeError = false } = {}) {
  const calls: string[] = [];
  const auth = {
    async setSession(tokens: { access_token: string; refresh_token: string }) {
      calls.push(`tokens:${tokens.access_token}:${tokens.refresh_token}`);
      return { error: exchangeError ? new Error("expired") : null };
    },
    async exchangeCodeForSession(code: string) {
      calls.push(`code:${code}`);
      return { error: exchangeError ? new Error("expired") : null };
    },
    async getSession() {
      calls.push("session");
      return { data: { session: session ? {} : null }, error: sessionError ? new Error("expired") : null };
    },
    async getUser() {
      calls.push("user");
      return { data: { user: verified ? { email: "admin@example.com" } : null }, error: verified ? null : new Error("invalid") };
    },
  } as unknown as Pick<SupabaseClient["auth"], "getSession" | "getUser" | "setSession" | "exchangeCodeForSession">;
  return { auth, calls };
}

test("a failed invitation cannot fall back to an existing signed-in account", async () => {
  for (const suffix of ["#error=access_denied", "?error_code=otp_expired", "#error_code=otp_expired"]) {
    const { auth, calls } = fixture();
    await assert.rejects(verifyPasswordSession(auth, `https://example.com/auth/setup${suffix}`), { message: invalidSetupLink });
    assert.deepEqual(calls, []);
  }
});

test("missing, expired and unverified sessions cannot set a password", async () => {
  for (const options of [{ session: false }, { sessionError: true }, { verified: false }]) {
    const { auth } = fixture(options);
    await assert.rejects(verifyPasswordSession(auth, "https://example.com/auth/setup"), { message: invalidSetupLink });
  }
});

test("waits for SDK link processing, then verifies identity with the auth server", async () => {
  const { auth, calls } = fixture();
  assert.equal(await verifyPasswordSession(auth, "https://example.com/auth/setup"), "admin@example.com");
  assert.deepEqual(calls, ["session", "user"]);
});

test("passwords must meet minimum length and match", () => {
  assert.match(passwordValidation("short", "short")!, /8 characters/);
  assert.match(passwordValidation("long-enough", "different")!, /do not match/);
  assert.equal(passwordValidation("long-enough", "long-enough"), null);
});

test("accepts dashboard invitation tokens and PKCE recovery codes", async () => {
  for (const [suffix, expected] of [
    ["#access_token=fake-access&refresh_token=fake-refresh&type=invite", "tokens:fake-access:fake-refresh"],
    ["?code=fake-code", "code:fake-code"],
  ]) {
    const { auth, calls } = fixture();
    await verifyPasswordSession(auth, `https://example.com/auth/setup${suffix}`);
    assert.deepEqual(calls, [expected, "session", "user"]);
    const failed = fixture({ exchangeError: true });
    await assert.rejects(verifyPasswordSession(failed.auth, `https://example.com/auth/setup${suffix}`));
    assert.deepEqual(failed.calls, [expected]);
  }
});

test("incomplete invitation tokens never reuse a previous session", async () => {
  const { auth, calls } = fixture();
  await assert.rejects(verifyPasswordSession(auth, "https://example.com/auth/setup#access_token=incomplete"));
  assert.deepEqual(calls, []);
});
