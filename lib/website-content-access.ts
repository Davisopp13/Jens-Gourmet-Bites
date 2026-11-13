export function isWebsiteContentAdmin(user: { id: string; is_anonymous?: boolean }, allowlist: string | undefined, additionalAllowlist?: string) {
  return !user.is_anonymous && [allowlist, additionalAllowlist].filter(Boolean).join(",").split(",").map(id => id.trim()).filter(Boolean).includes(user.id);
}
