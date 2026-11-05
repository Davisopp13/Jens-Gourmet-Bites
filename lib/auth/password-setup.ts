import type { SupabaseClient } from "@supabase/supabase-js";

export const invalidSetupLink = "This invitation or reset link is missing or expired. Request a new password link from the login page.";

export async function verifyPasswordSession(
  auth: Pick<SupabaseClient["auth"], "getSession" | "getUser" | "setSession" | "exchangeCodeForSession">,
  href: string,
) {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  // Never fall back to another signed-in account when an email link failed.
  if ([url.searchParams, fragment].some(params => params.has("error") || params.has("error_code") || params.has("error_description"))) {
    throw new Error(invalidSetupLink);
  }
  // Dashboard invites use implicit tokens; browser reset requests use PKCE.
  if (fragment.has("access_token") || fragment.has("refresh_token")) {
    const access_token = fragment.get("access_token");
    const refresh_token = fragment.get("refresh_token");
    if (!access_token || !refresh_token) throw new Error(invalidSetupLink);
    const { error } = await auth.setSession({ access_token, refresh_token });
    if (error) throw new Error(invalidSetupLink);
  } else if (url.searchParams.has("code")) {
    const { error } = await auth.exchangeCodeForSession(url.searchParams.get("code")!);
    if (error) throw new Error(invalidSetupLink);
  } else if (fragment.has("type")) {
    throw new Error(invalidSetupLink);
  }
  const { data, error } = await auth.getSession();
  if (error || !data.session) throw new Error(invalidSetupLink);
  const { data: verified, error: verificationError } = await auth.getUser();
  if (verificationError || !verified.user?.email) throw new Error(invalidSetupLink);
  return verified.user.email;
}

export function passwordValidation(password: string, confirmation: string) {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}
