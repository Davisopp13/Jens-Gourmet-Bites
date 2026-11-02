import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHomeNote } from "@/lib/site-settings";
import NoteEditor from "@/components/admin/NoteEditor";

export default async function AdminNotePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const note = await getHomeNote(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-primary">Home Note</h1>
        <p className="text-gray-600 mt-1">
          Edit the sticky note on the home page. Changes show on the site as soon as you save.
        </p>
      </div>
      <NoteEditor initial={note} />
    </div>
  );
}
