import type { SupabaseClient } from "@supabase/supabase-js";

export interface HomeNote {
  title: string;
  quote: string;
  footer: string;
}

export const DEFAULT_HOME_NOTE: HomeNote = {
  title: "a note from Jen",
  quote:
    "What started as a passion for baking in my Johns Creek kitchen has grown into a labor of love that I'm thrilled to share with you. Each cookie is made from scratch using family recipes and the finest ingredients, because you deserve nothing less than the best.",
  footer:
    "Proudly serving Metro Atlanta. Local pickup available, and we can arrange delivery for larger orders.",
};

export const HOME_NOTE_KEYS = {
  title: "home_note_title",
  quote: "home_note_quote",
  footer: "home_note_footer",
} as const;

// Falls back to the default copy if the table is missing or a row is empty,
// so the home page never breaks before the migration has been run.
export async function getHomeNote(supabase: SupabaseClient): Promise<HomeNote> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", Object.values(HOME_NOTE_KEYS));

  if (error || !data) return DEFAULT_HOME_NOTE;

  const byKey = new Map<string, string>(data.map((r) => [r.key, r.value]));
  return {
    title: byKey.get(HOME_NOTE_KEYS.title)?.trim() || DEFAULT_HOME_NOTE.title,
    quote: byKey.get(HOME_NOTE_KEYS.quote)?.trim() || DEFAULT_HOME_NOTE.quote,
    footer: byKey.get(HOME_NOTE_KEYS.footer)?.trim() ?? DEFAULT_HOME_NOTE.footer,
  };
}
