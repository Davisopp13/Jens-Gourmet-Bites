import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contentAdminAllowed, getContentState } from "@/lib/website-content-server";
import WebsiteContentEditor from "@/components/admin/WebsiteContentEditor";

export const dynamic = "force-dynamic";

export default async function WebsiteContentPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/admin/login");
  if (!contentAdminAllowed(user)) return <p role="alert">This account cannot edit website content.</p>;
  try {
    const initial = await getContentState();
    return <WebsiteContentEditor initial={initial} />;
  } catch {
    return <div className="space-y-4"><h1 className="font-display text-3xl">Website Content</h1><p role="alert">Website Content is temporarily unavailable. Your published website is still available. Please check the Website Content setup and try again.</p><Link className="btn-secondary" href="/admin/content">Try again</Link></div>;
  }
}
