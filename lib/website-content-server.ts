import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomeNote } from "@/lib/site-settings";
import { DEFAULT_WEBSITE_CONTENT, websiteContentSchema, type ContentState } from "./website-content";
import { isWebsiteContentAdmin } from "./website-content-access";

// React cache deduplicates metadata/page reads only within this render request.
export const getPublishedContent = cache(async () => {
  const db = await createClient();
  const { data } = await db.from("website_content").select("content").eq("id", true).maybeSingle();
  const parsed = websiteContentSchema.safeParse(data?.content);
  if (parsed.success) return parsed.data;
  // Safe rollout: retain the existing editable note until the migration is applied.
  const note = await getHomeNote(db);
  return { ...DEFAULT_WEBSITE_CONTENT, noteTitle: note.title, noteMessage: note.quote, noteFooter: note.footer };
});

export function contentAdminAllowed(user: { id: string; is_anonymous?: boolean }) {
  const allowed = process.env.WEBSITE_CONTENT_ADMIN_USER_IDS ?? process.env.RECEIPT_ADMIN_USER_IDS ?? "";
  // Add content-only editors without replacing the existing authorization list.
  return isWebsiteContentAdmin(user, allowed, process.env.WEBSITE_CONTENT_ADDITIONAL_ADMIN_USER_IDS);
}

export async function getContentState(): Promise<ContentState> {
  // Read both rows in one database snapshot, including during another admin's publish.
  const { data, error } = await createAdminClient().rpc("get_website_content_state");
  if (error || !data) throw error ?? new Error("Website content is not initialized");
  return {
    ...data,
    published: websiteContentSchema.parse(data.published),
    draft: data.draft === null ? null : websiteContentSchema.parse(data.draft),
    previous: data.previous === null ? null : websiteContentSchema.parse(data.previous),
  };
}
