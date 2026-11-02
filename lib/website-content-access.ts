export function isWebsiteContentAdmin(user: { id: string; is_anonymous?: boolean }, allowlist: string | undefined) {
  return !user.is_anonymous && (allowlist ?? "").split(",").map(id => id.trim()).filter(Boolean).includes(user.id);
}
