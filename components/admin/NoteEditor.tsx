"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_HOME_NOTE, HOME_NOTE_KEYS, type HomeNote } from "@/lib/site-settings";
import NoteCard from "@/components/catalog/NoteCard";

interface NoteEditorProps {
  initial: HomeNote;
}

export default function NoteEditor({ initial }: NoteEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [note, setNote] = useState<HomeNote>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));
    setStatus("idle");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");

    const { error: dbError } = await supabase.from("site_settings").upsert([
      { key: HOME_NOTE_KEYS.title, value: note.title.trim() },
      { key: HOME_NOTE_KEYS.quote, value: note.quote.trim() },
      { key: HOME_NOTE_KEYS.footer, value: note.footer.trim() },
    ]);

    if (dbError) {
      setStatus("error");
      setError(
        dbError.message.includes("site_settings")
          ? "The site_settings table doesn't exist yet. Run the SITE SETTINGS section of supabase/migration.sql in the Supabase SQL Editor, then try again."
          : dbError.message
      );
      return;
    }

    setStatus("saved");
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSave} className="space-y-5">
        {status === "error" && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {status === "saved" && (
          <div role="status" className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            <p className="text-sm text-green-700">Saved. The home page is updated.</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
            Note heading
          </label>
          <input id="title" name="title" type="text" required maxLength={60} value={note.title} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label htmlFor="quote" className="mb-2 block text-sm font-medium text-gray-700">
            Jen&apos;s message
          </label>
          <textarea id="quote" name="quote" required rows={7} maxLength={900} value={note.quote} onChange={handleChange} className="input-field resize-y" />
          <p className="mt-1 text-xs text-gray-500">
            Quotation marks are added for you. {note.quote.length}/900
          </p>
        </div>

        <div>
          <label htmlFor="footer" className="mb-2 block text-sm font-medium text-gray-700">
            Small line underneath <span className="text-gray-500">(optional)</span>
          </label>
          <textarea id="footer" name="footer" rows={3} maxLength={300} value={note.footer} onChange={handleChange} className="input-field resize-y" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={status === "saving"} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {status === "saving" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" aria-hidden="true" />
                Save note
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setNote(DEFAULT_HOME_NOTE);
              setStatus("idle");
            }}
            className="btn-secondary"
          >
            <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
            Reset to original
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-4 font-cat-hand text-3xl font-bold text-cat-rust">Live preview</h2>
        <div className="rounded-xl bg-cat-paper p-6 pt-8 shadow-inner [background-image:repeating-linear-gradient(transparent_0_39px,#C9DCE8_39px_40px)]">
          <NoteCard note={note} animated={false} />
        </div>
      </div>
    </div>
  );
}
