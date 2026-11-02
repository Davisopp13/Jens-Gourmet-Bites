"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT_FIELDS, websiteContentSchema, type ContentState, type WebsiteContent } from "@/lib/website-content";
import ContentPreview from "./ContentPreview";

const same = (a: WebsiteContent, b: WebsiteContent) => CONTENT_FIELDS.every(({ key }) => a[key] === b[key]);
function date(value: string | null) { return value ? new Date(value).toLocaleString() : "Not yet"; }

export default function WebsiteContentEditor({ initial }: { initial: ContentState }) {
  const [state, setState] = useState(initial);
  const [content, setContent] = useState(initial.draft ?? initial.published);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [largePreview, setLargePreview] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const dirty = !same(content, state.draft ?? state.published);
  const publishable = state.draft !== null && !same(state.draft, state.published);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const warnNavigation = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented) return;
      const link = (event.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (link && link.target !== "_blank" && link.href !== window.location.href && !window.confirm("Leave without saving these edits?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", warnNavigation, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", warnNavigation, true); };
  }, [dirty]);

  async function action(action: "save" | "publish" | "restore") {
    if (lock.current) return;
    if (action === "restore" && dirty && !window.confirm("Replace your unsaved edits with the previous published version?")) return;
    if (action === "restore" && state.draft && !dirty && !window.confirm("Replace the saved draft with the previous published version?")) return;
    if (action === "save") {
      const parsed = websiteContentSchema.safeParse(content);
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the content."); return; }
    }
    lock.current = true;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/website-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision: state.revision, ...(action === "save" ? { content } : {}) }),
      });
      const next = await response.json();
      if (!response.ok) { setConflict(response.status === 409); throw new Error(next.error || "Content could not be saved."); }
      setState(next); setContent(next.draft ?? next.published); setConflict(false);
      setMessage(action === "save" ? "Draft saved. Customers still see the published version." : action === "publish" ? "Published. The website and search metadata are updated." : "Previous version loaded as a draft. Preview it, then publish when ready.");
    } catch (error) { setError(error instanceof Error ? error.message : "Content could not be saved. Your edits are still here."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function reload() {
    if (!window.confirm("Load the latest saved version? This replaces the edits currently in this editor.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/website-content", { cache: "no-store" });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error);
      setState(next); setContent(next.draft ?? next.published); setError(""); setConflict(false);
      setMessage("Loaded the latest saved version.");
    } catch { setError("Could not load the latest version. Your edits are still here."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl text-primary">Website Content</h1><p className="mt-2 text-gray-700">Edit your customer-facing wording. Save a draft, check the preview, then publish when you&apos;re ready.</p></div>
      <div className="rounded-xl border border-cat-ink/20 bg-white p-4">
        <p className="font-semibold" role="status">{dirty ? "Unsaved edits" : publishable ? "Saved draft · not published" : "Up to date with the published website"}</p>
        <p className="mt-1 text-sm text-gray-600">Last published: {date(state.publishedAt)}{state.draftSavedAt ? ` · Draft saved: ${date(state.draftSavedAt)}` : ""}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => action("save")} disabled={busy || !dirty || conflict} className="btn-secondary min-h-11 disabled:opacity-50">{busy ? "Working…" : "Save draft"}</button>
          <button type="button" onClick={() => action("publish")} disabled={busy || dirty || !publishable || conflict} className="btn-primary min-h-11 disabled:opacity-50">Publish saved draft</button>
          <button type="button" onClick={() => action("restore")} disabled={busy || !state.previous || conflict} className="btn-secondary min-h-11 disabled:opacity-50">Restore previous version</button>
          <button type="button" onClick={() => { dialog.current?.showModal(); setLargePreview(true); }} className="btn-secondary min-h-11">Preview edits</button>
        </div>
        {dirty && <p className="mt-3 text-sm text-gray-700">Save your edits before publishing.</p>}
        <p className="mt-3 text-sm text-gray-600">{state.previous ? `Previous publication: ${date(state.previousPublishedAt)}. Restore loads it as a draft; the live site changes only when you publish.` : "After your first publication, the previous version will be available to restore."}</p>
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">{error}{conflict && <button type="button" onClick={reload} disabled={busy} className="ml-3 min-h-11 underline">Load latest version</button>}</div>}
      {message && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-900">{message}</p>}
      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          {["Home", "Ordering", "Contact & footer", "Search & sharing"].map(group => (
            <fieldset key={group} disabled={busy} className="min-w-0 space-y-5 rounded-xl border border-cat-ink/20 bg-white p-4 sm:p-6">
              <legend className="px-2 font-display text-xl">{group}</legend>
              {group === "Contact & footer" && <p className="text-sm text-gray-600">The public email is shown to customers. Order notification delivery is configured separately.</p>}
              {CONTENT_FIELDS.filter(field => field.group === group).map(field => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="mb-2 block text-sm font-semibold">{field.label}{"optional" in field ? " (optional)" : ""}</label>
                  {"multiline" in field ? <textarea id={field.key} rows={field.key === "noteMessage" ? 6 : 3} maxLength={field.max} value={content[field.key]} onChange={event => { setContent({ ...content, [field.key]: event.target.value }); setMessage(""); }} className="input-field min-w-0 resize-y" aria-describedby={`${field.key}-count`} /> : <input id={field.key} type={field.key === "publicEmail" ? "email" : "text"} maxLength={field.max} value={content[field.key]} onChange={event => { setContent({ ...content, [field.key]: event.target.value }); setMessage(""); }} className="input-field min-w-0" aria-describedby={`${field.key}-count`} />}
                  <p id={`${field.key}-count`} className="mt-1 text-right text-xs text-gray-500">{content[field.key].length}/{field.max}</p>
                </div>
              ))}
            </fieldset>
          ))}
          <button type="button" onClick={() => action("save")} disabled={busy || !dirty || conflict} className="btn-secondary min-h-11 disabled:opacity-50">Save draft</button>
        </div>
        <section className="min-w-0 self-start xl:sticky xl:top-32" aria-label="Live content preview">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl">Mobile preview</h2><button type="button" onClick={() => { dialog.current?.showModal(); setLargePreview(true); }} className="min-h-11 rounded-lg border border-cat-ink/30 bg-white px-3 text-sm">Open larger preview</button></div>
          <p className="mb-4 text-sm text-gray-600">Shows your current edits, including unsaved wording. Preview orders cannot be sent.</p>
          <ContentPreview content={content} />
        </section>
      </div>
      <dialog ref={dialog} aria-labelledby="content-preview-title" onClose={() => setLargePreview(false)} className="m-auto max-h-[95vh] w-[1200px] max-w-[95vw] overflow-y-auto rounded-xl bg-cat-paper p-4 text-cat-ink backdrop:bg-black/50">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 id="content-preview-title" className="font-display text-xl">Website preview</h2><button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-lg border border-cat-ink/30 px-4">Close preview</button></div>
        {largePreview && <ContentPreview content={content} desktop />}
      </dialog>
    </div>
  );
}
