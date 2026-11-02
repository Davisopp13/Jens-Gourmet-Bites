import type { HomeNote } from "@/lib/site-settings";

interface NoteCardProps {
  note: HomeNote;
  animated?: boolean;
}

export default function NoteCard({ note, animated = true }: NoteCardProps) {
  return (
    <div
      className={`${animated ? "cat-note" : "-rotate-[0.6deg]"} relative min-w-0 bg-cat-note px-6 py-7 shadow-[0_8px_18px_rgba(74,46,31,.25)] md:px-9`}
    >
      <div
        aria-hidden="true"
        className="absolute -top-3.5 left-[12%] h-[30px] w-24 bg-[rgba(208,88,74,.55)]"
      />
      <div className="font-cat-hand text-[30px] font-bold text-cat-rust">{note.title}</div>
      <p className="mt-1 whitespace-pre-line font-cat-display text-2xl leading-[1.4] md:text-[28px]">
        &ldquo;{note.quote}&rdquo;
      </p>
      {note.footer && (
        <p className="mt-3 whitespace-pre-line text-base leading-relaxed">{note.footer}</p>
      )}
    </div>
  );
}
