"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { invalidSetupLink, passwordValidation, verifyPasswordSession } from "@/lib/auth/password-setup";

export default function PasswordSetupPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: false, auth: { detectSessionInUrl: false } },
  ));
  const verification = useRef<Promise<string> | null>(null);
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    verification.current ??= verifyPasswordSession(supabase.auth, window.location.href);
    verification.current.then(verifiedEmail => {
      if (active) setEmail(verifiedEmail);
    }).catch(() => {
      if (active) setError(invalidSetupLink);
    }).finally(() => {
      // Remove email credentials from the address bar after SDK consumption.
      window.history.replaceState(null, "", "/auth/setup");
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, [supabase]);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    const validationError = passwordValidation(password, confirmation);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError("");
    try {
      // Recheck identity before changing a credential in a potentially stale tab.
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || data.user?.email !== email) throw new Error(invalidSetupLink);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmation("");
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your password. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cat-wood px-4 py-12 text-cat-ink">
      <section className="w-full max-w-md rounded-xl bg-cat-paper p-8 shadow-xl">
        <Cookie className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="font-display text-center text-3xl">{saved ? "Password saved" : "Set your admin password"}</h1>
        {checking ? <p className="mt-6 flex items-center justify-center gap-2" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Checking your link…</p> : saved ? (
          <div className="mt-6 space-y-6">
            <p role="status">Your password is ready. You can now open the admin dashboard.</p>
            <a href="/admin" className="btn-primary w-full">Open admin dashboard</a>
          </div>
        ) : (
          <>
            {error && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {email && <form onSubmit={savePassword} className="mt-6 space-y-5">
              <p className="text-sm break-all">Setting a password for <strong>{email}</strong>.</p>
              <div><label htmlFor="new-password" className="mb-2 block font-medium">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="input-field" /><p className="mt-1 text-sm">Use at least 8 characters.</p></div>
              <div><label htmlFor="confirm-password" className="mb-2 block font-medium">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} className="input-field" /></div>
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">{saving ? "Saving…" : "Save password"}</button>
            </form>}
          </>
        )}
        <Link href="/admin/login" className="mt-6 flex min-h-[44px] items-center justify-center text-sm underline">Back to login</Link>
      </section>
    </main>
  );
}
